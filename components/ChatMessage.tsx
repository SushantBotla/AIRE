import { User, Bot } from "lucide-react";
import { motion } from "motion/react";
import { PropertyCard } from "./PropertyCard";

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

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  properties?: Property[];
  onPropertyClick?: (property: Property) => void;
}

export function ChatMessage({ role, content, properties, onPropertyClick }: ChatMessageProps) {
  const isUser = role === "user";

  // Check if this is a property listing response
  const hasProperties = properties && properties.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
      )}
      
      <div
        className={`${hasProperties ? "max-w-full" : "max-w-[70%]"} ${
          isUser ? "rounded-2xl px-4 py-3 bg-blue-600 text-white" : ""
        }`}
      >
        {/* Text Content */}
        {content && !isUser && !hasProperties && (
          <div className="bg-gray-100 text-gray-900 rounded-2xl px-4 py-3">
            <p className="whitespace-pre-wrap break-words">{content}</p>
          </div>
        )}
        
        {isUser && (
          <p className="whitespace-pre-wrap break-words">{content}</p>
        )}

        {/* Property Listings */}
        {hasProperties && !isUser && (
          <div className="space-y-4">
            {content && (
              <div className="bg-gray-100 text-gray-900 rounded-2xl px-4 py-3 mb-4">
                <p className="whitespace-pre-wrap break-words">{content}</p>
              </div>
            )}
            <div className="grid grid-cols-1 gap-4">
              {properties.map((property, index) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  index={index}
                  onClick={() => onPropertyClick?.(property)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
          <User className="w-5 h-5 text-white" />
        </div>
      )}
    </motion.div>
  );
}