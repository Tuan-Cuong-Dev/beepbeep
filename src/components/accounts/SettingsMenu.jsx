import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaCog } from "react-icons/fa";

const SettingsMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const router = useRouter();

  // Đóng menu khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Xử lý chọn option
  const handleSelect = (option) => {
    setIsOpen(false);
    if (option === "Account info") {
      router.push("/account");
    }
  };

  return (
    <div className="relative font-sans" ref={menuRef}>
      {/* Settings button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1.5 text-gray-700 "
      >
        <FaCog className="w-5 h-5 sm:w-4 sm:h-4" />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded border z-50">
          {["Edit your profile", "Edit profile photos", "Edit cover photos", "Account info"].map(
            (option, index) => (
              <button
                key={index}
                onClick={() => handleSelect(option)}
                className="block w-full text-left px-4 py-2 text-gray-700 "
              >
                {option}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default SettingsMenu;
