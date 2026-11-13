import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Bed, Bath, X, MapPin, Ruler } from "lucide-react";
import { motion } from "motion/react";

interface PropertyDetailPageProps {
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
    sqft?: string;
    rating?: string;
    explanation?: string;
  };
  onClose: () => void;
}

export function PropertyDetailPage({ property, onClose }: PropertyDetailPageProps) {
  // Format price to include commas
  const formatPrice = (price: string) => {
    const numPrice = price.replace(/[^0-9]/g, '');
    if (numPrice) {
      return `$${parseInt(numPrice).toLocaleString()}`;
    }
    return price;
  };

  // Calculate estimated monthly payment (rough estimate: price * 0.00686 for 30yr at ~6.5%)
  const calculateMonthlyPayment = (price: string) => {
    const numPrice = parseInt(price.replace(/[^0-9]/g, ''));
    if (numPrice) {
      const monthly = Math.round(numPrice * 0.00686);
      return `$${monthly.toLocaleString()}`;
    }
    return "$0";
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-white z-50 overflow-y-auto"
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="fixed top-6 right-6 z-10 bg-white rounded-full p-3 shadow-lg hover:bg-gray-100 transition-colors"
      >
        <X className="w-6 h-6 text-gray-700" />
      </button>

      {/* Property Image */}
      <div className="relative w-full h-[60vh] bg-gray-200">
        <ImageWithFallback
          src={property.mainImg}
          alt={property.address}
          className="w-full h-full object-cover"
        />
        {property.rating && (
          <div className={`absolute top-6 left-6 px-4 py-2 rounded-full ${getRatingColor(property.rating)} shadow-lg`}>
            <span>{property.rating}</span>
          </div>
        )}
      </div>

      {/* Property Information */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* FOR SALE Badge */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 bg-green-600 rounded-full"></div>
          <span className="text-green-600">FOR SALE</span>
        </div>

        {/* Price */}
        <div className="mb-4">
          <h1 className="text-gray-900 inline">{formatPrice(property.price)}</h1>
          <span className="text-gray-600 ml-3">Est. {calculateMonthlyPayment(property.price)}/mo</span>
        </div>

        {/* Beds, Baths, Sqft */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-gray-900">{property.bed} bd</span>
          </div>
          <span className="text-gray-400">•</span>
          <div className="flex items-center gap-2">
            <span className="text-gray-900">{property.bath} ba</span>
          </div>
          {property.sqft && (
            <>
              <span className="text-gray-400">•</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-900">{property.sqft} sq ft</span>
              </div>
            </>
          )}
        </div>

        {/* Address */}
        <div className="mb-8">
          <p className="text-gray-900">{property.address}, {property.city}, {property.state} {property.zip}</p>
        </div>

        {/* Rating Explanation */}
        {property.explanation && (
          <div className="mb-8">
            <h2 className="text-gray-900 mb-3">AI Assessment</h2>
            <div className="p-6 bg-gray-50 rounded-lg">
              <p className="text-gray-700">{property.explanation}</p>
            </div>
          </div>
        )}

        {/* View on Zillow Button */}
        <a
          href={property.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          View Full Details on Zillow
        </a>
      </div>
    </motion.div>
  );
}
