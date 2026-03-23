import Link from "next/link"
import { MapPinIcon, StarIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface HotelCardProps {
  id: string
  name: string
  city: string
  country: string
  starRating: number
  reviewScore: number
  reviewCount: number
  amenities: string
  cheapestPrice: number
  tripGroupId?: string
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} star hotel`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <StarIcon
          key={i}
          className={`size-3.5 ${
            i < rating
              ? "fill-amber-400 text-amber-400"
              : "fill-muted text-muted"
          }`}
        />
      ))}
    </div>
  )
}

function ReviewScoreBadge({ score, count }: { score: number; count: number }) {
  let label = "Good"
  if (score >= 9) label = "Exceptional"
  else if (score >= 8) label = "Excellent"
  else if (score >= 7) label = "Very Good"

  return (
    <div className="flex items-center gap-1.5">
      <span
        className="inline-flex size-8 items-center justify-center rounded-md text-xs font-bold text-white"
        style={{ backgroundColor: "#1a56db" }}
      >
        {score.toFixed(1)}
      </span>
      <div className="text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {" "}
          ({count.toLocaleString()} reviews)
        </span>
      </div>
    </div>
  )
}

export function HotelCard({
  id,
  name,
  city,
  country,
  starRating,
  reviewScore,
  reviewCount,
  amenities,
  cheapestPrice,
  tripGroupId,
}: HotelCardProps) {
  let amenitiesList: string[] = []
  try {
    amenitiesList = JSON.parse(amenities)
  } catch {
    // ignore parse errors
  }

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <div className="flex flex-col sm:flex-row">
        {/* Image placeholder */}
        <div className="flex h-40 shrink-0 items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 sm:h-auto sm:w-48 sm:rounded-l-xl">
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <MapPinIcon className="size-8" />
            <span className="text-xs font-medium">
              {city}
            </span>
          </div>
        </div>

        {/* Hotel info */}
        <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
          {/* Header: name, stars, review score */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold leading-tight">{name}</h3>
              <StarRating rating={starRating} />
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPinIcon className="size-3" />
                {city}, {country}
              </p>
            </div>
            <ReviewScoreBadge score={reviewScore} count={reviewCount} />
          </div>

          {/* Amenity tags */}
          {amenitiesList.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {amenitiesList.slice(0, 6).map((amenity) => (
                <Badge key={amenity} variant="secondary" className="text-[10px]">
                  {amenity}
                </Badge>
              ))}
              {amenitiesList.length > 6 && (
                <Badge variant="outline" className="text-[10px]">
                  +{amenitiesList.length - 6} more
                </Badge>
              )}
            </div>
          )}

          {/* Price and CTA */}
          <div className="mt-auto flex items-end justify-between border-t pt-3">
            <div>
              <p className="text-xs text-muted-foreground">From</p>
              <p className="text-xl font-bold" style={{ color: "#1a56db" }}>
                ${cheapestPrice.toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground">per night</p>
            </div>
            <Link href={`/hotels/${id}${tripGroupId ? `?tripGroupId=${tripGroupId}` : ""}`}>
              <Button
                size="sm"
                className="bg-[#1a56db] text-white hover:bg-[#1648c0]"
              >
                View Details
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  )
}
