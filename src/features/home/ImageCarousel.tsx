import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const AUTOPLAY_INTERVAL_MS = 5000

interface ImageCarouselProps {
  images: { src: string; alt: string }[]
}

export function ImageCarousel({ images }: ImageCarouselProps) {
  const [index, setIndex] = useState(0)
  // Manual navigation (arrows) stops the autoplay for good.
  const [autoplay, setAutoplay] = useState(true)

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

  if (images.length === 0) return null

  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-neutral-800">
      <AnimatePresence mode="wait">
        <motion.img
          key={images[index].src}
          src={images[index].src}
          alt={images[index].alt}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 h-full w-full object-cover"
        />
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
