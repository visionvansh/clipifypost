
"use client";

import Image from "next/image";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";

const data = [
  {
    name: 'Mon',
    Income: 4000,
   
  },
  {
    name: 'Tue',
    Income: 3000,
    
  },
  {
    name: 'Wed',
    Income: 2000,
    pv: 9800,
    amt: 2290,
  },
  {
    name: 'Thu',
    Income: 2780,
 
  },
  {
    name: 'Fri',
    Income: 1890,
   
  },
  {
    name: 'Sat',
    Income: 2390,
    
  },
  {
    name: 'Sun',
    Income: 3490,
    pv: 4300,
    amt: 2100,
  },
];

const FinanceChart = () => {
  return (
    <div className="bg-white rounded-xl w-full h-full p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold">Finance</h1>
        <Image src="/moreDark.png" alt="" width={20} height={20} />
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          width={500}
          height={400}
          data={data}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Area type="monotone" dataKey="Income" stroke="#8884d8" fill="#8884d8" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FinanceChart;
