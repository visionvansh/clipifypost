import Image from "next/image";
import AttendanceChart from "./AttendanceChart";
import prisma from "@/lib/prisma";

const AttendanceChartContainer = async () => {
  // Fetching attendance data from the database
  const resData = await prisma.attendance.findMany({
    where: {}, // You can add any filters here if needed
  });

  // Mapping data to display total views per person
  const attendanceMap: { [key: string]: number } = {};

  resData.forEach((item) => {
    const name = item.nameOfPerson;
    if (name && item.views) {
      if (attendanceMap[name]) {
        attendanceMap[name] += item.views;
      } else {
        attendanceMap[name] = item.views;
      }
    }
  });

  // Converting the attendance map into an array for the chart
  const data = Object.keys(attendanceMap).map((name) => ({
    name,
    present: attendanceMap[name],
  }));

  console.log("Chart Data: ", data); // Check the structure of the data

  return (
    <div className="bg-white rounded-lg p-4 h-full">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold">Views</h1>
        <Image src="/moreDark.png" alt="" width={20} height={20} />
      </div>
      <AttendanceChart data={data} />
    </div>
  );
};

export default AttendanceChartContainer;
