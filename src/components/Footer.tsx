
import { Instagram, Linkedin, Twitter } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-100">
      <div className="container px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h3 className="font-heading text-xl font-bold text-primary mb-4">
              Puntpad
            </h3>
            <p className="text-gray-600 max-w-md">
              Track your bets, analyze performance, and discover winning trends with our intuitive betting journal.
            </p>
          </div>
          
          <div>
            <h4 className="font-heading font-semibold text-gray-900 mb-4">
              Links
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-600 hover:text-primary transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-primary transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-primary transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-primary transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-heading font-semibold text-gray-900 mb-4">
              Follow Us
            </h4>
            <div className="flex space-x-4">
              <a
                href="#"
                className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-primary hover:text-white transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-primary hover:text-white transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-primary hover:text-white transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-center text-gray-600 text-sm">
            © {new Date().getFullYear()} Puntpad. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
