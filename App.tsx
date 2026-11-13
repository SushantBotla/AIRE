import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "./components/ChatMessage";
import { PropertyCard } from "./components/PropertyCard";
import { PropertyDetailPage } from "./components/PropertyDetailPage";
import { Send, Loader2, MessageCircle, X } from "lucide-react";
import { Progress } from "./components/Progress";
import rawListings from "./listings.json";
import { motion } from "motion/react";

interface Property {
  id: string;
  url: string;
  price: string;
  bed: string;
  bath: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  mainImg: string;
  rating?: string;
  explanation?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  properties?: Property[];
}

interface Listing {
  id: string;
  url: string;
  price: string;
  bed: string;
  bath: string;
  address: string;
  city: string;
  state: string;
  street: string;
  zip: string;
  mainImg: string;
  otherImgs: string[];
}

// Use bundled listing data for local development without external services.
function getListings(): Listing[] {
  return (rawListings as Array<Record<string, unknown>>).map((l) => ({
    id: String(l.id ?? ""),
    url: String(l.url ?? ""),
    price: String(l.price ?? "N/A"),
    bed: String(l.beds ?? "N/A"),
    bath: String(l.baths ?? "N/A"),
    address: String(l.fullAddress ?? "N/A"),
    city: String(l.city ?? "N/A"),
    state: String(l.state ?? "N/A"),
    street: String(l.street ?? "N/A"),
    zip: String(l.zipcode ?? "N/A"),
    mainImg: String(l.image ?? ""),
    otherImgs: typeof l.photos === "string" ? l.photos.split(",").map(x => x.trim()).filter(Boolean) : [],
  }));
}
type Recommendation = { message: string; properties: Property[] };
async function requestRecommendations(query: string, excludeIds: string[] = []): Promise<Recommendation> {
  const response = await fetch("/api/recommend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, excludeIds }),
  });
  if (!response.ok) throw new Error(`Recommendation service returned ${response.status}`);
  const data: unknown = await response.json();
  if (!data || typeof data !== "object" || !("message" in data) || !("properties" in data)) {
    throw new Error("Invalid recommendation response");
  }
  const result = data as Recommendation;
  if (typeof result.message !== "string" || !Array.isArray(result.properties)) throw new Error("Invalid recommendation shape");
  return result;
}

export default function App() {
  const [conversation, setConversation] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  useEffect(() => {
    if (isChatOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isChatOpen]);

  // Show three sample properties on the home page
  useEffect(() => {
    const fetchFeaturedProperties = async () => {
      const listings = getListings();
      // Show a deterministic preview
      const shuffled = [...listings].sort((a, b) => a.id.localeCompare(b.id));
      setFeaturedProperties(shuffled.slice(0, 3));
    };
    fetchFeaturedProperties();
  }, []);

  const handleSendMessage = async () => {
    const query = input.trim();
    if (!query || isLoading) return;
    setInput("");
    setIsLoading(true);
    setLoadingProgress(25);
    const nextConversation: Message[] = [...conversation, { role: "user", content: query }];
    setConversation(nextConversation);
    try {
      const result = await requestRecommendations(query);
      setLoadingProgress(100);
      if (result.properties.length) setFeaturedProperties(result.properties);
      setConversation([...nextConversation, { role: "assistant", content: result.message, properties: result.properties }]);
    } catch (error) {
      console.error("Recommendation error:", error);
      setConversation([...nextConversation, { role: "assistant", content: "I couldn't load recommendations. Please try again." }]);
    } finally {
      setIsLoading(false);
      setLoadingProgress(0);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleViewMore = async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const lastUserQuery = [...conversation].reverse().find(m => m.role === "user")?.content ?? "";
      const result = await requestRecommendations(lastUserQuery, featuredProperties.map(p => p.id));
      setFeaturedProperties(prev => [...prev, ...result.properties]);
    } catch (error) {
      console.error("Unable to fetch more properties:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 pb-20">
      {/* Property Detail Page Overlay */}
      {selectedProperty && (
        <PropertyDetailPage
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
        />
      )}

      {/* Main Content - Scrollable */}
      <div 
        className="px-6 py-12 transition-all duration-300 overflow-y-auto"
        style={{
          marginRight: isChatOpen ? '500px' : 'auto',
          marginLeft: isChatOpen ? '0' : 'auto',
          maxWidth: isChatOpen ? 'calc(100vw - 500px)' : '1280px',
          maxHeight: 'calc(100vh - 100px)',
        }}
      >
        <div 
          className="transition-all duration-300"
          style={{
            maxWidth: isChatOpen ? '650px' : '896px',
            marginLeft: isChatOpen ? '2rem' : 'auto',
            marginRight: 'auto',
          }}
        >
          <div className="bg-indigo-600 rounded-lg px-8 py-6 mb-8 shadow-lg">
            <h1 className="text-white mb-3">Welcome to AIRE, AI Integrated Real Estate</h1>
            <p className="text-indigo-100">
              Real Estate done smarter: Browse properties, Get expert advice, And find your dream home with a trustable assistant.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featuredProperties.map((property, i) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, scale: 0.8, y: 30 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                whileHover={{ 
                  scale: isChatOpen ? 0.95 : 1.15,
                  zIndex: 10,
                  transition: { duration: 0.3, ease: "easeOut" }
                }}
                transition={{ 
                  type: "spring",
                  stiffness: 100,
                  damping: 15,
                  delay: i * 0.15
                }}
                className="transition-all duration-300"
                style={{
                  transform: isChatOpen ? 'scale(0.85)' : 'scale(1)',
                }}
              >
                <PropertyCard
                  property={{
                    id: property.id,
                    url: property.url,
                    price: property.price,
                    bed: property.bed,
                    bath: property.bath,
                    address: property.address,
                    city: property.city,
                    state: property.state,
                    zip: property.zip,
                    mainImg: property.mainImg,
                    rating: property.rating,
                    explanation: property.explanation
                  }}
                  onClick={() => setSelectedProperty(property)}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* View More Button - Fixed at bottom */}
      <div 
        className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 transition-all duration-300"
        style={{
          left: isChatOpen ? 'calc(50% - 250px)' : '50%',
        }}
      >
        {isLoadingMore ? (
          <div className="flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow-lg">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            <span className="text-gray-700">Loading more properties...</span>
          </div>
        ) : (
          <button
            onClick={handleViewMore}
            className="bg-indigo-600 text-white px-8 py-3 rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
          >
            View more
          </button>
        )}
      </div>

      {/* Floating Chat Button */}
      <div
        className="fixed bottom-6 right-6 z-50"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all duration-300 flex items-center justify-center ${
            isHovered ? "w-56 px-6" : "w-16 h-16"
          }`}
          style={{ height: isHovered ? "4rem" : "4rem" }}
        >
          {isHovered ? (
            <span className="flex items-center gap-2 whitespace-nowrap">
              <MessageCircle className="w-6 h-6" />
              <span>Chat with us</span>
            </span>
          ) : (
            <MessageCircle className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Chat Panel */}
      {isChatOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-24 right-6 w-[440px] h-[520px] bg-white rounded-lg shadow-2xl z-50 flex flex-col"
        >
          {/* Chat Header */}
          <div className="bg-indigo-600 text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
            <div>
              <h2 className="text-white">Real Estate Chat Bot</h2>
              <p className="text-indigo-100 text-sm">Your trusted AI real estate guide</p>
            </div>
            <button
              onClick={() => setIsChatOpen(false)}
              className="text-white hover:bg-indigo-700 rounded-full p-2 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50">
            {conversation.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="flex gap-3 justify-start mt-4"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div className="bg-gray-100 text-gray-900 rounded-2xl px-4 py-3 max-w-[85%]">
                  <p className="mb-2">👋 Hi! I'm your real estate assistant.</p>
                  <p>Let's get more specific - is there a certain location you're interested in or do you have a non-negotiable price range? I can help you find the best Dallas properties that match your needs!</p>
                </div>
              </motion.div>
            )}

            <div className="space-y-4">
              {conversation.map((message, index) => (
                <ChatMessage
                  key={index}
                  role={message.role}
                  content={message.content}
                  properties={message.properties}
                  onPropertyClick={(property) => setSelectedProperty(property)}
                />
              ))}

              {isLoading && (
                <div className="space-y-3">
                  <div className="flex gap-3 justify-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <div className="bg-gray-100 rounded-2xl px-4 py-3 flex items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                      <span className="text-sm text-gray-600">Thinking...</span>
                    </div>
                  </div>
                  <div className="ml-11 mr-4">
                    <Progress value={loadingProgress} className="h-1" />
                    <p className="text-xs text-gray-500 mt-1">
                      {loadingProgress < 30 && "Processing your request..."}
                      {loadingProgress >= 30 && loadingProgress < 70 && "Generating response..."}
                      {loadingProgress >= 70 && loadingProgress < 100 && "Almost done..."}
                      {loadingProgress >= 100 && "Complete!"}
                    </p>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="bg-white border-t border-gray-200 px-4 py-4 rounded-b-lg">
            <div className="flex gap-2 items-end">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim()}
                className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}