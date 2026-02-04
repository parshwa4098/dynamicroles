"use client";
interface AnalyticsProps{
  title:string;
  value:number| string;
  color:string
}
export default function StatCard({ title, value, color }:AnalyticsProps) {
  return (
    
    <div className="h-full w-full bg-black p-6 rounded-2xl shadow-lg border border-gray-700 flex flex-col justify-between hover:border-gray-500 transition-colors duration-300">
      <h3 className="text-lg sm:text-xl font-medium text-gray-300">{title}</h3>
      <p className={`text-3xl sm:text-4xl font-bold mt-2 ${color}`}>{value}</p>
    </div>
  );
}