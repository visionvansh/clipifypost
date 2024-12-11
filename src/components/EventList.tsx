import prisma from "@/lib/prisma";

const AnnouncementList = async ({ dateParam }: { dateParam: string | undefined }) => {
  const date = dateParam ? new Date(dateParam) : new Date();

  // Fetch announcements based on the date field from your Announcement model
  const data = await prisma.announcement.findMany({
    where: {
      date: {
        gte: new Date(date.setHours(0, 0, 0, 0)),
        lte: new Date(date.setHours(23, 59, 59, 999)),
      },
    },
  });

  return data.map((announcement) => (
    <div
      className="p-5 rounded-md border-2 border-gray-100 border-t-4 odd:border-t-lamaSky even:border-t-lamaPurple"
      key={announcement.id}
    >
      <div className="flex items-center justify-between">
        <h1 className="font-semibold text-gray-600">{announcement.title}</h1>
        <span className="text-gray-300 text-xs">
          {announcement.date.toLocaleTimeString("en-UK", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })}
        </span>
      </div>
      <p className="mt-2 text-gray-400 text-sm">{announcement.description}</p>
    </div>
  ));
};

export default AnnouncementList;
