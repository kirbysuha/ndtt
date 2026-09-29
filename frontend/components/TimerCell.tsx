type TimerColor = "green" | "orange" | "red" | "gray";

interface TimerCellProps {
  value: string;
  color?: TimerColor;
}

const COLOR_CLASSES: Record<TimerColor, string> = {
  green: "text-green-700 font-medium",
  orange: "text-orange-600 font-medium",
  red: "text-red-600 font-bold",
  gray: "text-gray-400",
};

export function TimerCell({ value, color = "gray" }: TimerCellProps) {
  if (value === "-" || value === "") {
    return <span className="text-gray-300 text-xs">—</span>;
  }

  return (
    <span className={`text-xs ${COLOR_CLASSES[color]}`}>
      {value}
    </span>
  );
}
