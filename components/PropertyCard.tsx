import { ImageWithFallback } from "./figma/ImageWithFallback";
  import { Bed, Bath, MapPin } from "lucide-react";
  import { motion } from "motion/react";
  
  interface PropertyCardProps {
    property: {
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
    };
    index?: number;
    onClick?: () => void;
  }
  
  export function PropertyCard({ property, index = 0, onClick }: PropertyCardProps) {
    // Format price to include commas
    const formatPrice = (price: string) => {
      const numPrice = price.replace(/[^0-9]/g, '');
      if (numPrice) {
        return `$${parseInt(numPrice).toLocaleString()}`;
      }
      return price;
    };
  
    // Determine rating badge color
    const getRatingColor = (rating?: string) => {
      if (!rating) return "bg-gray-100 text-gray-800";
      const r = rating.toLowerCase();
      if (r.includes("excellent") || r.includes("a+") || r.includes("a-")) {
        return "bg-green-100 text-green-800";
      }
      if (r.includes("good") || r.includes("b")) {
        return "bg-blue-100 text-blue-800";
      }
      if (r.includes("bad") || r.includes("f") || r.includes("d")) {
        return "bg-red-100 text-red-800";
      }
      return "bg-yellow-100 text-yellow-800";
    };
  
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
        onClick={onClick}
        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-200 flex flex-col h-[440px] cursor-pointer"
      >
        {/* Property Image */}
        <div className="relative h-56 bg-gray-200 overflow-hidden">
          <ImageWithFallback
            src={property.mainImg}
            alt={property.address}
            className="w-full h-full object-cover"
          />
          {property.rating && (
            <div className={`absolute top-3 right-3 px-3 py-1 rounded-full ${getRatingColor(property.rating)}`}>
              <span className="text-sm">{property.rating}</span>
            </div>
          )}
        </div>
  
        {/* Property Details */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Price */}
          <div className="mb-3">
            <p className="text-gray-900 text-2xl">{formatPrice(property.price)}</p>
          </div>
  
          {/* Beds & Baths */}
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-1.5 text-gray-700">
              <Bed className="w-4 h-4" />
              <span className="text-sm">{property.bed} bd</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-700">
              <Bath className="w-4 h-4" />
              <span className="text-sm">{property.bath} ba</span>
            </div>
          </div>
  
          {/* Address */}
          <div className="flex items-start gap-2 mb-3">
            <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-gray-700">
              <p>{property.address}</p>
              <p>{property.city}, {property.state} {property.zip}</p>
            </div>
          </div>
  
          {/* Rating Explanation - Fixed height with truncation */}
          <div className="flex-1">
            {property.explanation && (
              <div className="p-3 bg-gray-50 rounded-lg h-full">
                <p className="text-sm text-gray-700 line-clamp-3">{property.explanation}</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }