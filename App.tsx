import { useState, useRef, useEffect } from "react";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { ChatMessage } from "./components/ChatMessage";
import { PropertyCard } from "./components/PropertyCard";
import { PropertyDetailPage } from "./components/PropertyDetailPage";
import { Send, Loader2, MessageCircle, X } from "lucide-react";
import { Progress } from "./components/ui/progress";
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

const supabaseUrl = 'https://abheupvblxijzvoibmjn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiaGV1cHZibHhpanp2b2libWpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NDE2OTIsImV4cCI6MjA3ODIxNzY5Mn0.EIROMlSeG9gu1_jfmN4GLekL1px0a9gd6yd640OPqCA';
const supabase = createClient(supabaseUrl, supabaseKey);

const ai = new GoogleGenAI({ apiKey: "AIzaSyDc-sdnVeqVMBMNNjPz71H3-n1q_YUuJ8Y" });

// Fetch listings from Supabase and parse into simple objects
async function getListings(): Promise<Listing[]> {
  const { data, error } = await supabase.from("listings").select("*");
  if (error) {
    console.error("Supabase error:", error);
    return [];
  }

  return data.map((l: any) => ({
    id: l.id,
    url: l.url,
    price: l.price?.toString() || "N/A",
    bed: l.beds?.toString() || "N/A",
    bath: l.baths?.toString() || "N/A",
    address: l.fullAddress || "N/A",
    city: l.city || "N/A",
    state: l.state || "N/A",
    street: l.street || "N/A",
    zip: l.zipcode || "N/A",
    mainImg: l.image || "N/A",
    otherImgs: l.photos || []
  }));
}

export default function App() {
  const [conversation, setConversation] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [featuredProperties, setFeaturedProperties] = useState<Listing[]>([]);
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

  // Fetch 3 random properties for the home page
  useEffect(() => {
    const fetchFeaturedProperties = async () => {
      const listings = await getListings();
      // Get 3 random properties
      const shuffled = [...listings].sort(() => 0.5 - Math.random());
      setFeaturedProperties(shuffled.slice(0, 3));
    };
    fetchFeaturedProperties();
  }, []);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);
    setLoadingProgress(0);

    // Add user message to conversation
    const newConversation: Message[] = [
      ...conversation,
      { role: "user", content: userMessage },
    ];
    setConversation(newConversation);

    // Simulate progress bar
    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 300);

    try {
      // Fetch listings from Supabase
      const listings = await getListings();
      
      if (!listings.length) {
        throw new Error("No listings available from database.");
      }

      // Generate AI response with real estate context using the original prompt structure
      const prompt = `You are a real estate expert. Here are the house listings: ${JSON.stringify(listings)}

Based on the user description: "${userMessage}", find the best 3 matching properties.

You MUST respond with VALID JSON in this exact format. DO NOT add any text before or after the JSON:
{
  "message": "A friendly message to the user",
  "properties": [
    {
      "id": "property id from listings",
      "url": "property url",
      "price": "property price",
      "bed": "number of beds",
      "bath": "number of baths",
      "address": "full street address",
      "city": "city",
      "state": "state",
      "zip": "zip code",
      "mainImg": "main image url",
      "rating": "Excellent, Good, or Bad",
      "explanation": "One short sentence explaining the rating"
    }
  ]
}

CRITICAL JSON FORMATTING RULES:
- All property values MUST be strings enclosed in double quotes
- Do NOT use single quotes anywhere
- Do NOT add trailing commas after the last item in arrays or objects
- Ensure ALL strings are properly closed with double quotes
- Escape any quotes inside strings with backslash
- Do NOT include any markdown formatting like \`\`\`json
- Return ONLY the JSON object, no other text before or after
- Each property object must have ALL fields listed above as strings

IMPORTANT RULES:
- If the user asks about real estate, return matching properties in the JSON format above
- ONLY return the top 3 best matching properties
- Always include a rating (Excellent, Good, or Bad) and explanation for each property
- If the user enters something unrelated to real estate, respond with {"message": "I can only help with real estate questions. Please ask about properties.", "properties": []}
- If the user asks about a location you don't have, respond with {"message": "I don't have listings for that location yet.", "properties": []}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      let aiResponse = response.text;
      
      // Clean up the response to extract JSON
      // Remove markdown code blocks and backticks
      aiResponse = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      
      // Try to extract JSON object if there's extra text
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiResponse = jsonMatch[0];
      }

      // Complete progress
      setLoadingProgress(100);

      // Parse the AI response
      try {
        const parsedResponse = JSON.parse(aiResponse);
        
        // Validate the response structure
        if (typeof parsedResponse !== 'object') {
          throw new Error('Response is not a valid object');
        }
        
        // Update featured properties if AI returned 3 properties
        if (parsedResponse.properties && parsedResponse.properties.length === 3) {
          setFeaturedProperties(parsedResponse.properties);
        }
        
        // Add AI response to conversation with properties
        setConversation([
          ...newConversation,
          { 
            role: "assistant", 
            content: parsedResponse.message || "",
            properties: parsedResponse.properties || []
          },
        ]);
      } catch (parseError) {
        console.error("Error parsing AI response:", parseError);
        console.error("Raw AI response:", aiResponse);
        
        // Show detailed error message to user
        const errorMessage = `I apologize, but I encountered an error processing the response. 

Error: ${parseError instanceof Error ? parseError.message : 'Unknown error'}

Please try rephrasing your question or ask about specific property features like location, price range, or number of bedrooms.`;
        
        setConversation([
          ...newConversation,
          { role: "assistant", content: errorMessage },
        ]);
      }
    } catch (error) {
      console.error("Error generating response:", error);
      setConversation([
        ...newConversation,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      clearInterval(progressInterval);
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
      // Fetch listings from Supabase
      const listings = await getListings();
      
      if (!listings.length) {
        return;
      }

      // Generate AI response asking for 3 more properties
      const prompt = `You are a real estate expert. Here are the house listings: ${JSON.stringify(listings)}

The user wants to see 3 more property recommendations. Find the best 3 matching properties that are different from the ones already shown.

You MUST respond with VALID JSON in this exact format. DO NOT add any text before or after the JSON:
{
  "message": "Here are 3 more properties you might like!",
  "properties": [
    {
      "id": "property id from listings",
      "url": "property url",
      "price": "property price",
      "bed": "number of beds",
      "bath": "number of baths",
      "address": "full street address",
      "city": "city",
      "state": "state",
      "zip": "zip code",
      "mainImg": "main image url",
      "rating": "Excellent, Good, or Bad",
      "explanation": "One short sentence explaining the rating"
    }
  ]
}

CRITICAL JSON FORMATTING RULES:
- All property values MUST be strings enclosed in double quotes
- Do NOT use single quotes anywhere
- Do NOT add trailing commas after the last item in arrays or objects
- Ensure ALL strings are properly closed with double quotes
- Escape any quotes inside strings with backslash
- Do NOT include any markdown formatting like \`\`\`json
- Return ONLY the JSON object, no other text before or after
- Each property object must have ALL fields listed above as strings

IMPORTANT RULES:
- ONLY return the top 3 best matching properties
- Always include a rating (Excellent, Good, or Bad) and explanation for each property`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      let aiResponse = response.text;
      
      // Clean up the response to extract JSON
      aiResponse = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      
      // Try to extract JSON object if there's extra text
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiResponse = jsonMatch[0];
      }

      // Parse the AI response
      try {
        const parsedResponse = JSON.parse(aiResponse);
        
        // Validate the response structure
        if (typeof parsedResponse !== 'object') {
          throw new Error('Response is not a valid object');
        }
        
        // Append new properties to existing ones
        if (parsedResponse.properties && parsedResponse.properties.length > 0) {
          setFeaturedProperties((prev) => [...prev, ...parsedResponse.properties]);
        }
      } catch (parseError) {
        console.error("Error parsing AI response:", parseError);
        console.error("Raw AI response:", aiResponse);
      }
    } catch (error) {
      console.error("Error generating more properties:", error);
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