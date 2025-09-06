import { Button } from "@/src/components/ui/button";
import Link from "next/link";

export default function Reviews() {
  return (
    <div className="bg-white p-6 rounded shadow-sm flex flex-col items-center justify-center">
      <h2 className="text-xl font-semibold mb-3">
        Write your first review!
      </h2>
      <p className="text-gray-700 mb-4 text-center">
        Your opinion matters! Start reviewing brands, stations, vehicles to do & more on vehicleRental.
      </p>
      <Link href="/reviews/new">
        <Button variant="ghost" type="button">Write Review</Button>
      </Link>
    </div>
  );
}
