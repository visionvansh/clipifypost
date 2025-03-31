import Image from "next/image";
import EventCalendar from "./EventCalendar";

const EventCalendarContainer = async ({
  searchParams,
}: {
  searchParams: { [keys: string]: string | undefined };
}) => {
  const { date } = searchParams;

  return (
    <div className="bg-gray-900 p-4 rounded-md shadow-lg border border-gray-700 text-white">
      <EventCalendar />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold my-4">📢 Announcements</h1>
        <Image src="/moreDark.png" alt="More" width={20} height={20} />
      </div>
      <div className="flex flex-col gap-4">

      </div>
    </div>
  );
};

export default EventCalendarContainer;
