/* eslint-disable @next/next/no-img-element */

import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { GalleryThumbnailsIcon, UserCircle2Icon } from "lucide-react";
import { GraffitiUnderline } from "../../../../components/web/graffityUnderline";
import Link from "next/link";

const carouselImages = [
  "/oso.jpg",
  "/Reno.jpg",
  "/zorro.jpg",
  "/oso-polar.jpg",
  "/aurora.jpg",
];

export function Header() {
  return (
    <header className="relative min-h-[90vh] flex flex-col justify-between py-12">
      {/* BG Image */}
      <img
        src="/pingüinos.jpg"
        alt="Nature landscape"
        className="absolute inset-0 w-full h-full object-cover object-center z-0"
      />

      {/* Top: Title, subtitle, CTAs */}
      <div
        className="relative z-20 flex flex-col items-center justify-start text-center w-full pt-24 pb-4"
        style={{ minHeight: "48vh" }}
      >
        <h1 className="text-5xl md:text-8xl font-extrabold tracking-tight text-[#393737] drop-shadow-2xl mb-2">
          <span className="text-[#F73B07]">Wild</span>{" "}
          <GraffitiUnderline>Wonders</GraffitiUnderline>
        </h1>
        <p className="max-w-xl text-base md:text-lg font-normal text-[#393737] leading-[1] mb-7">
          Capturing the untamed beauty of our planet, one breathtaking moment at
          a time.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-2">
          <Button className="w-auto px-6 py-2">
            <GalleryThumbnailsIcon className="text-[#F73B07]" />
            Explore
          </Button>
          <Link href="/register">
            <Button className="w-auto px-6 py-2">
              <UserCircle2Icon className="text-[#F73B07]" />
              Register
            </Button>
          </Link>
        </div>
      </div>

      {/* Bottom: Carousel with shadcn/ui and continuous scroll (add effect if needed) */}
      <div
        className="relative z-20 w-full flex flex-col items-center justify-center pb-8"
        style={{ minHeight: "35vh" }}
      >
        <Carousel
          opts={{ loop: true, align: "center", dragFree: true }}
          className="w-full px-12"
        >
          <CarouselContent className="-ml-4">
            {carouselImages.map((src, idx) => (
              <CarouselItem
                key={idx}
                className="px-6 basis-[90%] md:basis-1/2 lg:basis-1/3"
              >
                <div className="flex items-center justify-center">
                  <div className="w-full h-full rounded-2xl overflow-hidden bg-white/10 border border-white/10 shadow-lg">
                    <img
                      src={src}
                      alt={`Carousel ${idx + 1}`}
                      className="w-full h-full object-cover object-center"
                    />
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </header>
  );
}
