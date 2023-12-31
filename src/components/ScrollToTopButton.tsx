import { ArrowUpIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";

export const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  const handleScroll = () => {
    const scrollY = window.scrollY;
    setIsVisible(scrollY > 1000); 
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-[4rem] right-[7rem] hidden rounded-full bg-black/10 p-3 text-black transition duration-300 ease-in-out hover:bg-black/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 lg:block xl:bottom-[6rem] xl:right-[10rem] ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <ArrowUpIcon className="h-4 w-4 text-black dark:text-white" />
    </button>
  );
};
