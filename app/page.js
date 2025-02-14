"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import styles from "./page.module.css";
import monthData from "../public/data.json";

// Order of months for cycling through
const months = Object.keys(monthData);

// Define flip variants for forward navigation
const backwardFlipVariants = {
  initial: { rotateY: -90, opacity: 0 },
  animate: {
    rotateY: 0,
    opacity: 1,
    transition: { duration: 0.9, ease: "easeOut" },
  },
  exit: {
    rotateY: 90,
    opacity: 0,
    transition: { duration: 0.9, ease: "easeIn" },
  },
};

// Define flip variants for backward navigation
const forwardFlipVariants = {
  initial: { rotateY: 90, opacity: 0 },
  animate: {
    rotateY: 0,
    opacity: 1,
    transition: { duration: 0.9, ease: "easeOut" },
  },
  exit: {
    rotateY: -90,
    opacity: 0,
    transition: { duration: 0.9, ease: "easeIn" },
  },
};

// Variants for the staggered text container
const textContainerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.03 } },
};

// Variants for each letter in the text
const textChildVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// Variants for the improved button animation
const buttonVariants = {
  hover: {
    scale: 1.05,
    boxShadow: "0px 8px 15px rgba(0, 0, 0, 0.3)",
    transition: { duration: 0.3, ease: "easeInOut" },
  },
  tap: { scale: 0.95 },
};
// Assuming your main content is in this component

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PageContent />
    </Suspense>
  );
}
function PageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [lang, setLang] = useState("en"); // Default language is English
  const [flipDirection, setFlipDirection] = useState("forward"); // "forward" or "backward"
  const audioRef = useRef(null);

  // Read the "month" parameter from the URL (default to "start" if not provided)
  const monthParam = searchParams.get("month");
  const currentMonth = monthParam ? monthParam.toLowerCase() : "start";
  const content = monthData[currentMonth];

  // Determine if we're on the first or last page
  const isFirstPage = currentMonth === months[0];
  const isLastPage = currentMonth === months[months.length - 1];

  // Handler for next page (flip forward)
  const handleNextMonth = () => {
    if (isFirstPage) {
      localStorage.setItem("userInteracted", "true");
    }
    setFlipDirection("forward");
    const currentIndex = months.indexOf(currentMonth);
    const nextIndex = (currentIndex + 1) % months.length;
    const nextMonth = months[nextIndex];
    router.push(`/?month=${nextMonth}`);
  };

  // Handler for previous page (flip backward)
  const handlePrevPage = () => {
    setFlipDirection("backward");
    const currentIndex = months.indexOf(currentMonth);
    const prevIndex = (currentIndex - 1 + months.length) % months.length;
    const prevMonth = months[prevIndex];
    router.push(`/?month=${prevMonth}`);
  };

  // Auto-play the song for pages (except "start") if the user has already interacted.
  useEffect(() => {
    let handleUserInteraction;
    if (
      content.song &&
      (currentMonth !== "start" ||
        localStorage.getItem("userInteracted") === "true")
    ) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(content.song);
      if (localStorage.getItem("userInteracted") === "true") {
        audioRef.current
          .play()
          .catch((err) => console.error("Playback error:", err));
      } else {
        handleUserInteraction = () => {
          audioRef.current
            .play()
            .catch((err) =>
              console.error("Playback error after interaction:", err)
            );
          window.removeEventListener("click", handleUserInteraction);
        };
        window.addEventListener("click", handleUserInteraction);
      }
    }
    return () => {
      if (handleUserInteraction) {
        window.removeEventListener("click", handleUserInteraction);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [content.song, currentMonth]);

  // Helper function to render staggered text
  const renderStaggeredText = (text) => {
    return (
      <motion.p
        className={styles.body}
        variants={textContainerVariants}
        initial="hidden"
        animate="show"
      >
        {text?.split("").map((letter, i) => (
          <motion.span key={i} variants={textChildVariants}>
            {letter}
          </motion.span>
        ))}
      </motion.p>
    );
  };

  return (
    <AnimatePresence mode="wait">
      <div className={styles.mainContain}>
        {/* Sticky language selector at the top right */}
        <div className={styles.sticky}>
          <label style={{ marginRight: "10px" }}>
            <input
              type="radio"
              name="lang"
              value="en"
              checked={lang === "en"}
              onChange={() => setLang("en")}
            />{" "}
            English
          </label>
          <label>
            <input
              type="radio"
              name="lang"
              value="ko"
              checked={lang === "ko"}
              onChange={() => setLang("ko")}
            />{" "}
            한국어
          </label>
        </div>
        <motion.div
          key={currentMonth}
          className={styles.main}
          style={{ perspective: 1000, transformStyle: "preserve-3d" }}
          variants={
            flipDirection === "forward"
              ? forwardFlipVariants
              : backwardFlipVariants
          }
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {/* Header with a simple fade-in */}
          <motion.h1
            className={styles.body}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {content.title[lang]}
          </motion.h1>
          {/* Loop through the images and text */}
          {content.images.map((image, index) => (
            <div key={index} className={styles.section}>
              {image && (
                <motion.img
                  src={image}
                  alt={`Image ${index + 1}`}
                  className={styles.img}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                />
              )}
              {renderStaggeredText(
                Array.isArray(content.text)
                  ? content.text[index]?.[lang]
                  : content.text[lang]
              )}
            </div>
          ))}
          {/* Fade in extra images */}
          {content.extraImage && (
            <div className={styles.extraImagesContainer}>
              {content.extraImage.map((extra, index) => (
                <motion.img
                  key={index}
                  src={extra}
                  className={styles.img}
                  alt={`Extra Image ${index + 1}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                />
              ))}
            </div>
          )}
          {/* Navigation buttons */}
          {isFirstPage ? (
            // On first page: only show "Flip Page" (next)
            <motion.button
              onClick={handleNextMonth}
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className={styles.button}
            >
              {lang === "ko" ? "페이지 넘기기" : "Flip Page"}
            </motion.button>
          ) : isLastPage ? (
            // On last page: show "Restart" and "Get the Playlist"
            <div className={styles.lastPageNavigation}>
              <motion.button
                onClick={() => router.push(`/?month=start`)}
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className={styles.button}
              >
                {lang === "ko" ? "다시 시작" : "Restart"}
              </motion.button>
              <a
                href="https://open.spotify.com/playlist/6AwKcpc0o2Alpe4yo7bi3b?si=c6802cfce9cd402cD"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.playlistLink}
              >
                {lang === "ko" ? "플레이리스트 받기" : "Get the Playlist"}
              </a>
            </div>
          ) : (
            // On middle pages: show both "Flip Back" and "Flip Page"
            <div className={styles.midPageNavigation}>
              <motion.button
                onClick={handlePrevPage}
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className={styles.button}
              >
                {lang === "ko" ? "뒤로 넘기기" : "Flip Back"}
              </motion.button>
              <motion.button
                onClick={handleNextMonth}
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className={styles.button}
              >
                {lang === "ko" ? "페이지 넘기기" : "Flip Page"}
              </motion.button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
