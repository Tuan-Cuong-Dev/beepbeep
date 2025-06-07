import Link from "next/link";
import { Button } from "@/src/components/ui/button";

export default function Photos() {
  return (
    <div className="bg-white p-6 rounded shadow-sm flex flex-col items-center justify-center">
      <h2 className="text-xl font-semibold mb-3">
        Post your first photo!
      </h2>
      <p className="text-gray-700 mb-4 text-center">
        Help other travelers see what you’ve seen — so they know what to expect!
      </p>
      <Link href="/photos/new">
        <Button variant="ghost" type="button">Post Photo</Button>
      </Link>
    </div>
  );
}
