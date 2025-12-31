"use client";

import * as React from "react";
import { MotionConfig, motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";

interface TextStaggerHoverProps {
  text: string;
  index: number;
}

interface HoverSliderVideoProps {
  index: number;
  src: string;
  poster?: string;
}

interface HoverSliderProps {}

interface HoverSliderContextValue {
  activeSlide: number;
  changeSlide: (index: number) => void;
}

function splitText(text: string) {
  const words = text.split(" ").filter((word) => word.length > 0);
  return { words };
}

const HoverSliderContext = React.createContext<
  HoverSliderContextValue | undefined
>(undefined);

function useHoverSliderContext() {
  const context = React.useContext(HoverSliderContext);
  if (context === undefined) {
    throw new Error(
      "useHoverSliderContext must be used within a HoverSliderProvider"
    );
  }
  return context;
}

export function usePrefersReducedMotion() {
  const [prefersReduced, setPrefersReduced] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReduced(mediaQuery.matches);
    update();
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", update);
      return () => mediaQuery.removeEventListener("change", update);
    }
    mediaQuery.addListener(update);
    return () => mediaQuery.removeListener(update);
  }, []);

  return prefersReduced;
}

function composeRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  return (node: T | null) => {
    refs.forEach((ref) => {
      if (!ref) {
        return;
      }
      if (typeof ref === "function") {
        ref(node);
        return;
      }
      (ref as React.MutableRefObject<T | null>).current = node;
    });
  };
}

export const HoverSlider = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & HoverSliderProps
>(({ children, className, ...props }, ref) => {
  const [activeSlide, setActiveSlide] = React.useState<number>(0);
  const changeSlide = React.useCallback(
    (index: number) => setActiveSlide(index),
    []
  );

  return (
    <HoverSliderContext.Provider value={{ activeSlide, changeSlide }}>
      <div ref={ref} className={className} {...props}>
        {children}
      </div>
    </HoverSliderContext.Provider>
  );
});
HoverSlider.displayName = "HoverSlider";

export const TextStaggerHover = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & TextStaggerHoverProps
>(({ text, index, className, onMouseEnter, onFocus, ...props }, ref) => {
  const { activeSlide, changeSlide } = useHoverSliderContext();
  const { words } = splitText(text);
  const isActive = activeSlide === index;
  let globalIndex = 0;
  const handleActivate = (
    event: React.MouseEvent<HTMLSpanElement> | React.FocusEvent<HTMLSpanElement>
  ) => {
    changeSlide(index);
    if ("type" in event && event.type === "mouseenter") {
      onMouseEnter?.(event as React.MouseEvent<HTMLSpanElement>);
    } else {
      onFocus?.(event as React.FocusEvent<HTMLSpanElement>);
    }
  };

  return (
    <span
      className={cn(
        "relative inline-flex flex-wrap origin-bottom overflow-hidden",
        className
      )}
      {...props}
      ref={ref}
      onMouseEnter={handleActivate}
      onFocus={handleActivate}
    >
      {words.map((word, wordIndex) => (
        <React.Fragment key={`word-${wordIndex}`}>
          <span className="inline-flex whitespace-nowrap">
            {word.split("").map((char) => {
              const charIndex = globalIndex;
              globalIndex += 1;
              return (
                <span
                  key={`${char}-${charIndex}`}
                  className="relative inline-block overflow-hidden"
                >
                  <MotionConfig
                    transition={{
                      delay: charIndex * 0.025,
                      duration: 0.3,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                  >
                    <motion.span
                      className="inline-block opacity-20"
                      initial={{ y: "0%" }}
                      animate={isActive ? { y: "-110%" } : { y: "0%" }}
                    >
                      {char}
                    </motion.span>

                    <motion.span
                      className="absolute left-0 top-0 inline-block opacity-100"
                      initial={{ y: "110%" }}
                      animate={isActive ? { y: "0%" } : { y: "110%" }}
                    >
                      {char}
                    </motion.span>
                  </MotionConfig>
                </span>
              );
            })}
          </span>
          {wordIndex < words.length - 1 ? " " : null}
        </React.Fragment>
      ))}
    </span>
  );
});
TextStaggerHover.displayName = "TextStaggerHover";

export const clipPathVariants = {
  visible: {
    clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
  },
  hidden: {
    clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0px)",
  },
};

export const HoverSliderImageWrap = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "relative overflow-hidden",
        className
      )}
      {...props}
    />
  );
});
HoverSliderImageWrap.displayName = "HoverSliderImageWrap";

export const HoverSliderVideo = React.forwardRef<
  HTMLVideoElement,
  HTMLMotionProps<"video"> & HoverSliderVideoProps
>(({ index, className, ...props }, ref) => {
  const { activeSlide } = useHoverSliderContext();
  const prefersReducedMotion = usePrefersReducedMotion();
  const localRef = React.useRef<HTMLVideoElement | null>(null);
  const isActive = activeSlide === index;
  const { muted = true, playsInline = true, loop = true, preload = "metadata" } =
    props;

  React.useEffect(() => {
    const video = localRef.current;
    if (!video) {
      return;
    }
    if (prefersReducedMotion) {
      video.pause();
      video.currentTime = 0;
      return;
    }
    if (isActive) {
      video.play().catch(() => {});
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [isActive, prefersReducedMotion]);

  return (
    <motion.video
      ref={composeRefs(localRef, ref)}
      className={cn("absolute inset-0 h-full w-full object-cover", className)}
      transition={{ ease: [0.33, 1, 0.68, 1], duration: 0.8 }}
      variants={clipPathVariants}
      animate={isActive ? "visible" : "hidden"}
      muted={muted}
      playsInline={playsInline}
      loop={loop}
      preload={preload}
      {...props}
    />
  );
});
HoverSliderVideo.displayName = "HoverSliderVideo";

export { useHoverSliderContext };
