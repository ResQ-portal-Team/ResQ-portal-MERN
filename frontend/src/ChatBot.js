import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ChatBot = () => {
    const navigate = useNavigate();
    const [messages, setMessages] = useState([
        { text: "Hello! Welcome to ResQ Portal. Let's get you registered. What is your Student ID?", sender: "bot" }
    ]);
    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState({ studentId: '', realName: '', email: '', nickname: '', password: '' });
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false); 

    const steps = ["studentId", "realName", "email", "nickname", "password"];
    const prompts = [
        "Great! Now, what is your Real Name?",
        "Got it. What is your SLIIT Email address?",
        "Perfect! Now, choose a Nickname.",
        "Almost done! Set a strong Password.",
        "Registration complete! Redirecting..."
    ];

    const addBotMessage = (text, isError = false) => {
        setMessages(prev => [...prev, { text, sender: "bot", isError }]);
    };

    const handleRestart = () => {
        setStep(0);
        setIsBlocked(false);
        setMessages([{ text: "Okay, let's try again. What is your Student ID?", sender: "bot" }]);
    };

    const handleSend = async () => {
        if (!input || loading || isBlocked) return;

        const currentInput = input;
        const currentField = steps[step];
        setMessages(prev => [...prev, { text: currentInput, sender: "user" }]);
        setInput('');
        setLoading(true);

        try {
            // Real-time Validation for ID, Email, and Nickname
            if (currentField === 'studentId' || currentField === 'email' || currentField === 'nickname') {
                if (currentField === 'email' && !currentInput.endsWith('@my.sliit.lk')) {
                    addBotMessage("❌ Please use a valid @my.sliit.lk email address.", true);
                    setLoading(false);
                    return;
                }

                // Fetching from proxy defined in package.json
                const checkRes = await fetch('/api/auth/check-existing', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ field: currentField, value: currentInput })
                });

                if (!checkRes.ok) {
                    const errorData = await checkRes.json();
                    const errMsg = errorData.message || "Validation failed";
                    
                    addBotMessage(`❌ ${errMsg}`, true);

                    if (currentField === 'studentId') {
                        // Check if the error message contains "already" to trigger blocking logic
                        if (errMsg.toLowerCase().includes("already")) {
                            addBotMessage("It looks like you already have an account. Do you need help or want to try again?");
                            setIsBlocked(true); 
                        }
                    } else if (currentField === 'email') {
                        addBotMessage("Please check your email or use a different email address to continue.");
                    } else if (currentField === 'nickname') {
                        addBotMessage("Please choose a different nickname.");
                    }
                    
                    setLoading(false);
                    return;
                }
            }

            const updatedFormData = { ...formData, [currentField]: currentInput };
            setFormData(updatedFormData);

            if (currentField === 'password') {
                // Registration request
                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedFormData)
                });
                if (res.ok) {
                    addBotMessage("✅ All set! Redirecting...");
                    setTimeout(() => navigate('/dashboard'), 2000);
                } else {
                    const regError = await res.json();
                    addBotMessage(`❌ Registration failed: ${regError.message}`, true);
                }
            } else {
                addBotMessage(prompts[step]);
                setStep(step + 1);
            }
        } catch (err) {
            addBotMessage("❌ Connection error. Please make sure the backend is running.", true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 border rounded-3xl shadow-2xl overflow-hidden bg-white">
            <div className="bg-blue-600 p-5 text-white flex justify-between">
                <span className="font-bold">ResQ Support Bot</span>
                <button onClick={() => navigate('/')}>Cancel</button>
            </div>

            <div className="h-[400px] overflow-y-auto p-6 space-y-4 bg-gray-50">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-2xl ${
                            msg.sender === 'user' 
                                ? 'bg-blue-600 text-white' 
                                : msg.isError 
                                    ? 'bg-red-50 border border-red-200 text-red-600' 
                                    : 'bg-white border text-gray-700'
                        }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isBlocked && (
                    <button onClick={handleRestart} className="w-full py-2 bg-gray-200 hover:bg-gray-300 rounded-xl text-sm font-bold text-blue-600 transition-all">
                        🔄 Restart Registration
                    </button>
                )}
            </div>

            <div className="p-4 border-t flex gap-2">
                <input 
                    className="flex-1 bg-gray-100 rounded-xl px-4 py-2 outline-none"
                    value={input}
                    disabled={loading || isBlocked}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={isBlocked ? "Chat blocked..." : "Type here..."}
                />
                <button onClick={handleSend} disabled={loading || isBlocked} className="bg-blue-600 text-white p-2 rounded-xl">
                    Send
                </button>
            </div>
        </div>
    );
};

export default ChatBot;