const fs = require('fs');
let code = fs.readFileSync('src/components/chat/LiveChatWidget.tsx', 'utf8');

// Add the window event listener to open the chat
code = code.replace('useEffect(() => {', `useEffect(() => {
        const handleOpenChat = () => handleOpen();
        window.addEventListener('open-live-chat', handleOpenChat);
        return () => window.removeEventListener('open-live-chat', handleOpenChat);
    }, []);

    useEffect(() => {`);

// Hide the floating button on mobile
code = code.replace(
    `className="relative w-12 h-12 bg-indigo-600 rounded-full shadow-lg flex items-center justify-center text-white hover:bg-indigo-700 hover:scale-105 transition-all"`,
    `className="hidden md:flex relative w-12 h-12 bg-indigo-600 rounded-full shadow-lg items-center justify-center text-white hover:bg-indigo-700 hover:scale-105 transition-all"`
);

// We need to also adjust the wrapper so it doesn't block clicks on mobile when closed
code = code.replace(
    `<div className="fixed bottom-24 right-4 z-[9999] md:bottom-6 md:right-6">`,
    `<div className={\`fixed bottom-24 right-4 z-[9999] md:bottom-6 md:right-6 \${!isOpen ? 'hidden md:block' : ''}\`}>`
);

fs.writeFileSync('src/components/chat/LiveChatWidget.tsx', code);
console.log("Updated LiveChatWidget");
