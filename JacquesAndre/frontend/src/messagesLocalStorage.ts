import { json_stringify, json_parse } from "../../shared/json_wrapper.js"

const STORAGE_KEY = "chat_messages";
const MAX_MESSAGES = 20;

// Récupérer les messages depuis le localStorage
function getStoredMessages() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? json_parse(stored) : [];
}

// Ajouter un nouveau message
function storeMessage(message:any) {
    let messages = getStoredMessages();

    messages.push(message); // ajouter le nouveau message à la fin

    // Garder uniquement les X derniers messages
    if (messages.length > MAX_MESSAGES) {
        messages = messages.slice(messages.length - MAX_MESSAGES);
    }

    localStorage.setItem(STORAGE_KEY, json_stringify(messages));
}

function storeMP(message:any)
{
    const destinataire_pseudo = message?.from || message?.to
    const key = `mp_${destinataire_pseudo}`
    let messagesMP = localStorage.getItem(key)
    let messages
    if (!messagesMP) messages = []
    else messages = json_parse(messagesMP)
    messages.push(message)
    if (messages.length > MAX_MESSAGES) {
        messages = messages.slice(messages.length - MAX_MESSAGES);
    }
    localStorage.setItem(key, json_stringify(messages))
}

export function cleanHistory()
{
    localStorage.clear()
}

// Exemple d'utilisation quand un message arrive
export function handleIncomingMessage(message :any, displayMessage:any) {
    // message peut être un objet { from, text, timestamp }
	if (message.type === "chat")
    {
        storeMessage(message);
        displayMessage(message); // ta fonction existante pour l'affichage
    }
    if (message.type === "mp")
    {
        storeMP(message)
    }
}

// Pour récupérer et afficher les messages stockés au chargement de la page
export function loadChatHistory(displayMessage : any) {
	const messages = getStoredMessages();
	console.log("loadChatHistory", messages)
    messages.forEach(displayMessage);
}
