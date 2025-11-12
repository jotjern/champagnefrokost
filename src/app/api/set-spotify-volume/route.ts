import { authOptions } from "@/auth";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return new NextResponse("Please log with spotify", { status: 403 });
  }

  const target_volume = parseInt(
    req.nextUrl.searchParams.get("target_volume") ?? "-1"
  );
  if (isNaN(target_volume) || target_volume < 0 || target_volume > 100) {
    return new NextResponse(
      "Please provide a target volume between 0 and 100",
      { status: 400 }
    );
  }

  const headers = { Authorization: `Bearer ${session.accessToken}` };

  const response = await fetch("https://api.spotify.com/v1/me/player", {
    headers,
  });
  if (!response.ok) {
    throw new Error(response.statusText);
  }

  const data = await response.json();
  const start_volume: number = data["device"]["volume_percent"];

  if (start_volume === target_volume) {
    return;
  }

  const volume_step_size = Math.floor((target_volume - start_volume) / 10);
  for (let i = 0; i <= 10; i++) {
    const volume = start_volume + volume_step_size * i;

    const response = await fetch(
      `https://api.spotify.com/v1/me/player/volume?volume_percent=${volume}`,
      {
        headers,
        method: "PUT",
      }
    );

    if (!response.ok) {
      throw new Error(await response.text());
    }

    await new Promise((resolve) => setTimeout(resolve, 175));
  }

  return NextResponse.json({ start_volume });
}
