import { useEffect, useState } from 'react'
import { AnimatePresence, motion, type PanInfo } from 'framer-motion'
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react'

const AUTOPLAY_INTERVAL_MS = 5000
// Minimum horizontal drag (px) or flick speed (px/s) to count as a swipe,
// rather than an accidental touch.
const SWIPE_DISTANCE_THRESHOLD = 50
const SWIPE_VELOCITY_THRESHOLD = 400

interface ImageCarouselProps {
  images: { src: string; alt: string }[]
}

export function ImageCarousel({ images }: ImageCarouselProps) {
  const [index, setIndex] = useState(0)
  // Manual navigation (arrows) stops the autoplay for good.
  const [autoplay, setAutoplay] = useState(true)
  // Tracks whether the current image failed to load (e.g. offline) so we can
  // show a tidy placeholder instead of the browser's broken-image icon.
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setHasError(false)
  }, [index])

  useEffect(() => {
    if (!autoplay || images.length <= 1) return
    const id = setInterval(() => {
      setIndex((current) => (current + 1) % images.length)
    }, AUTOPLAY_INTERVAL_MS)
    return () => clearInterval(id)
  }, [autoplay, images.length])

  function goTo(next: number) {
    setAutoplay(false)
    setIndex((next + images.length) % images.length)
  }

  function handleDragEnd(_event: unknown, info: PanInfo) {
    if (
      info.offset.x <= -SWIPE_DISTANCE_THRESHOLD ||
      info.velocity.x <= -SWIPE_VELOCITY_THRESHOLD
    ) {
      goTo(index + 1)
    } else if (
      info.offset.x >= SWIPE_DISTANCE_THRESHOLD ||
      info.velocity.x >= SWIPE_VELOCITY_THRESHOLD
    ) {
      goTo(index - 1)
    }
  }

  if (images.length === 0) return null

  return (
    <div className="relative aspect-square w-full touch-pan-y overflow-hidden rounded-xl bg-neutral-800">
      <AnimatePresence mode="wait">
        {hasError ? (
          <motion.div
            key={`${images[index].src}-fallback`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 flex cursor-grab flex-col items-center justify-center gap-2 bg-neutral-800 text-neutral-500 active:cursor-grabbing"
          >
            <ImageOff size={40} />
            <p className="text-xs">Photo indisponible</p>
          </motion.div>
        ) : (
          <motion.img
            key={images[index].src}
            src={images[index].src}
            alt={images[index].alt}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            onError={() => setHasError(true)}
            className="absolute inset-0 h-full w-full cursor-grab object-cover object-top active:cursor-grabbing"
          />
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => goTo(index - 1)}
        aria-label="Previous photo"
        className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        type="button"
        onClick={() => goTo(index + 1)}
        aria-label="Next photo"
        className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
      >
        <ChevronRight size={20} />
      </button>

      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
        {images.map((image, i) => (
          <button
            key={image.src}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Go to photo ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
