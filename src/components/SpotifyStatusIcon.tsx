import { authOptions } from "@/auth";
import { getServerSession, Session } from "next-auth";
import Image from "next/image";
import Link from "next/link";

export default async function SpotifyStatusButton() {
  let session: Session | null = await getServerSession(authOptions);

  return (
    <div className="absolute bottom-0 right-0 p-4">
      {
        <Link
          href={
            session ? "/api/auth/signout/spotify" : "/api/auth/signin/spotify"
          }
        >
          <Image
            src="/spotify.svg"
            alt={"Spotify logo"}
            width={40}
            height={40}
            className={session ? "" : "grayscale contrast-200 invert"}
          />
        </Link>
      }
    </div>
  );
}
