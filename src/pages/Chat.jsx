import { useState, useEffect, useRef } from 'react';

// Función para procesar markdown básico
const formatMessage = (text) => {
  if (!text) return text;
  
  let formatted = text;
  
  // Emojis con espaciado y destacados
  formatted = formatted.replace(/(📋|🔍|📊|⚠️|✅|💡|🎯|📅|📈|🚨|📦|🤝|👩‍🍳|⚖️)/g, '<span class="text-lg mr-2 inline-block">$1</span>');
  
  // Secciones principales con emoji (como títulos)
  formatted = formatted.replace(/^(📋|🔍|💡)\s*\*\*(.*?)\*\*$/gm, '<div class="mb-4 mt-6 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400"><h3 class="text-lg font-bold text-blue-800"><span class="text-xl mr-2">$1</span>$2</h3></div>');
  
  // Subsecciones con emoji
  formatted = formatted.replace(/^(📊|⚠️|✅|🎯|📅|📈|👩‍🍳|⚖️)\s*\*\*(.*?)\*\*$/gm, '<div class="mb-3 mt-4"><h4 class="text-base font-semibold text-gray-800"><span class="text-lg mr-2">$1</span>$2</h4></div>');
  
  // Negritas restantes **texto**
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>');
  
  // Cursivas *texto*
  formatted = formatted.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em class="italic text-gray-700">$1</em>');
  
  // Listas con * o - (mejoradas)
  formatted = formatted.replace(/^[\*\-]\s+\*\*(.*?)\*\*:\s*(.+)$/gm, '<div class="ml-4 mb-2 p-2 bg-gray-50 rounded"><strong class="text-gray-900">$1:</strong> <span class="text-gray-700">$2</span></div>');
  formatted = formatted.replace(/^[\*\-]\s+(.+)$/gm, '<div class="ml-4 mb-1 text-gray-700">• $1</div>');
  
  // Saltos de línea simples
  formatted = formatted.replace(/\n/g, '<br/>');
  
  return formatted;
};

// Banco de preguntas organizadas por categoría
const questionCategories = {
  'alertas': {
    name: 'Alertas y Emergencias',
    emoji: '🚨',
    questions: [
      '¿Qué productos necesito distribuir urgentemente hoy?',
      '¿Tenemos productos caducados que debemos retirar inmediatamente?',
      '¿Cuál es el resumen ejecutivo del estado actual del almacén?'
    ]
  },
  'rendimiento': {
    name: 'Análisis de Rendimiento',
    emoji: '📊',
    questions: [
      '¿Qué categorías de alimentos se mueven más rápido y cuáles se estancan?',
      '¿Cuáles son nuestros productos estrella y cuáles nos están dando problemas?',
      '¿Cómo ha sido nuestro rendimiento operativo en los últimos meses?'
    ]
  },
  'donantes': {
    name: 'Gestión de Donantes',
    emoji: '🤝',
    questions: [
      '¿Quiénes son nuestros donantes más valiosos y cuándo donaron por última vez?',
      '¿Qué donantes no han donado recientemente y deberíamos contactar?',
      '¿Qué tipos de donantes (empresas, particulares, gobierno) son más consistentes?'
    ]
  },
  'organizacion': {
    name: 'Organización Física',
    emoji: '📦',
    questions: [
      '¿Cómo está distribuido nuestro inventario por estantes y ubicaciones?',
      '¿Qué estantes están sobrecargados y cuáles tienen capacidad disponible?',
      '¿Tenemos productos sin ubicar que necesiten ser organizados?'
    ]
  },
  'distribucion': {
    name: 'Distribución y Demanda',
    emoji: '🎯',
    questions: [
      '¿A dónde estamos enviando más alimentos y qué patrones de demanda vemos?',
      '¿Qué tipos de destinos (familias, comedores, instituciones) requieren más atención?',
      '¿Cuántos días de inventario tenemos basado en nuestro ritmo actual de entregas?'
    ]
  },
  'problemas': {
    name: 'Detección de Problemas',
    emoji: '🔍',
    questions: [
      '¿Hay productos que se están acumulando sin salir del almacén?',
      '¿Qué productos permanecen demasiado tiempo en el almacén?',
      '¿Tenemos productos que entran pero nunca salen?'
    ]
  },
  'estrategia': {
    name: 'Planificación Estratégica',
    emoji: '📈',
    questions: [
      '¿Cuál ha sido nuestra actividad de donaciones y entregas este mes comparado con anteriores?',
      '¿Qué categorías necesitan más atención en nuestras próximas campañas de donación?'
    ]
  },
  'cocina': {
    name: 'Planificación de Cocina',
    emoji: '👩‍🍳',
    questions: [
      '¿Qué productos tenemos disponibles para cocinar antes de que se echen a perder?',
      '¿Qué ingredientes debo usar urgentemente en la cocina?',
      '¿Con qué productos puedo hacer platillos esta semana antes de que caduquen?',
      '¿Qué puedo preparar para el desayuno con los productos disponibles?',
      '¿Qué opciones tengo para hacer la comida del mediodía con el inventario actual?',
      '¿Qué ingredientes tengo para preparar la cena de hoy?',
      '¿Qué menú semanal puedo planificar con los productos próximos a vencer?'
    ]
  },
  'planificacion_mixta': {
    name: 'Planificación Mixta',
    emoji: '⚖️',
    questions: [
      '¿Cómo puedo combinar productos urgentes con productos duraderos para hacer menús completos?',
      '¿Qué estrategia me recomiendas para usar productos urgentes sin desperdiciar los que duran más?',
      '¿Cómo organizo los menús de la semana para usar eficientemente productos con diferentes fechas de caducidad?',
      '¿Qué ingredientes puedo mezclar para hacer comidas balanceadas con productos próximos a caducar y estables?',
      '¿Cómo planifico un menú especial que use productos urgentes pero también tenga variedad?'
    ]
  }
};

// Lista plana para compatibilidad con el código existente
const questionBank = Object.values(questionCategories).flatMap(category => category.questions);

function Chat() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showQuestionMenu, setShowQuestionMenu] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Función para obtener preguntas aleatorias
  const getRandomQuestions = (count = 3, exclude = []) => {
    const availableQuestions = questionBank.filter(q => !exclude.includes(q));
    const shuffled = [...availableQuestions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  };

  useEffect(() => {
    // Generar o recuperar sessionId
    let storedSessionId = localStorage.getItem('chat-session-id');
    if (!storedSessionId) {
      storedSessionId = Array.from({length: 32}, () => Math.floor(Math.random() * 16).toString(16)).join('');
      localStorage.setItem('chat-session-id', storedSessionId);
    }
    setSessionId(storedSessionId);

    // Mensaje de bienvenida
    setMessages([{
      id: 1,
      text: '¡Hola! Soy tu asistente del almacén. ¿En qué puedo ayudarte hoy?',
      sender: 'bot',
      timestamp: new Date()
    }]);

    // Generar preguntas iniciales aleatorias
    setSuggestedQuestions(getRandomQuestions(3));
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (messageToSend = null) => {
    const message = messageToSend || inputMessage;
    if (!message.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      text: message,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await fetch('https://n8n.varac.io/webhook/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionId,
          chatInput: message
        })
      });

      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor');
      }

      const data = await response.json();
      
      // Verificar si hay error en la respuesta
      if (data.errorMessage) {
        throw new Error(data.errorMessage);
      }
      
      const botMessage = {
        id: Date.now() + 1,
        text: data.output || data.message || data.response || 'Lo siento, no pude procesar tu mensaje.',
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      
      // Generar nuevas preguntas sugeridas después de cada respuesta del bot
      // Cada 2-3 mensajes del usuario, mostrar nuevas sugerencias
      const userMessagesCount = messages.filter(m => m.sender === 'user').length + 1;
      if (userMessagesCount % 2 === 0) {
        // Obtener las preguntas ya usadas para no repetirlas
        const usedQuestions = messages
          .filter(m => m.sender === 'user')
          .map(m => m.text);
        setSuggestedQuestions(getRandomQuestions(3, usedQuestions));
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{
      id: Date.now(),
      text: '¡Hola! Soy tu asistente del almacén. ¿En qué puedo ayudarte hoy?',
      sender: 'bot',
      timestamp: new Date()
    }]);
    // Generar nuevo sessionId
    const newSessionId = Array.from({length: 32}, () => Math.floor(Math.random() * 16).toString(16)).join('');
    localStorage.setItem('chat-session-id', newSessionId);
    setSessionId(newSessionId);
    // Generar nuevas preguntas aleatorias
    setSuggestedQuestions(getRandomQuestions(3));
  };

  const handleCategorySelect = (categoryKey) => {
    setSelectedCategory(categoryKey);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
  };

  const handleQuestionSelect = (question) => {
    sendMessage(question);
    setShowQuestionMenu(false);
    setSelectedCategory(null);
  };

  const toggleQuestionMenu = () => {
    setShowQuestionMenu(!showQuestionMenu);
    setSelectedCategory(null);
  };

  return (
    <div className="fixed top-16 left-0 right-0 bottom-0 bg-gray-50 flex flex-col">
      {/* Header del chat */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-2xl mr-2">🤖</span>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Asistente del Almacén</h2>
            <p className="text-sm text-gray-500">Pregunta sobre inventario, productos y más</p>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title="Limpiar chat"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Área de mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                message.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-800'
              }`}
            >
              {message.sender === 'bot' ? (
                <div 
                  className="formatted-message"
                  dangerouslySetInnerHTML={{ 
                    __html: formatMessage(message.text)
                  }}
                />
              ) : (
                <p className="whitespace-pre-wrap">{message.text}</p>
              )}
              <p className={`text-xs mt-1 ${
                message.sender === 'user' ? 'text-blue-100' : 'text-gray-400'
              }`}>
                {new Date(message.timestamp).toLocaleTimeString('es-ES', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Preguntas sugeridas - aparecen al inicio y cada 2 mensajes */}
      {suggestedQuestions.length > 0 && !loading && (
        <div className="px-4 py-3 bg-gray-50 border-t">
          <p className="text-sm text-gray-600 mb-2">Preguntas sugeridas:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => {
                  sendMessage(question);
                  setSuggestedQuestions([]); // Ocultar sugerencias después de seleccionar
                }}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition-colors text-left"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Menú de preguntas categorizadas - persistente */}
      <div className="bg-white border-t border-gray-200">
        {/* Botón para mostrar/ocultar menú */}
        <div className="px-4 py-2 border-b border-gray-100">
          <button
            onClick={toggleQuestionMenu}
            className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            <span className="flex items-center">
              <span className="text-lg mr-2">💭</span>
              Preguntas por categoría
            </span>
            <svg 
              className={`w-4 h-4 transition-transform ${showQuestionMenu ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Contenido del menú desplegable */}
        {showQuestionMenu && (
          <div className="px-4 py-3 max-h-60 overflow-y-auto">
            {!selectedCategory ? (
              // Vista de categorías
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(questionCategories).map(([key, category]) => (
                  <button
                    key={key}
                    onClick={() => handleCategorySelect(key)}
                    className="p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                  >
                    <div className="flex items-center">
                      <span className="text-xl mr-2">{category.emoji}</span>
                      <span className="text-sm font-medium text-gray-800">{category.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              // Vista de preguntas de la categoría seleccionada
              <div>
                <div className="flex items-center mb-3">
                  <button
                    onClick={handleBackToCategories}
                    className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors mr-3"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    Volver
                  </button>
                  <div className="flex items-center">
                    <span className="text-lg mr-2">{questionCategories[selectedCategory].emoji}</span>
                    <span className="text-sm font-medium text-gray-800">{questionCategories[selectedCategory].name}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {questionCategories[selectedCategory].questions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuestionSelect(question)}
                      className="w-full p-2 text-left text-sm text-gray-700 bg-gray-50 hover:bg-blue-50 hover:text-blue-800 rounded border border-gray-200 hover:border-blue-300 transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input área */}
      <div className="bg-white border-t px-4 py-3">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu mensaje..."
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !inputMessage.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Chat;