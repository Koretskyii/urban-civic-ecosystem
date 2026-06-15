import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  DoughnutController,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';

let registered = false;

// chart.js v4 is tree-shakeable — controllers, elements and scales must be
// registered before the generic <Chart> renders.
export const registerCharts = (): void => {
  if (registered) return;

  ChartJS.register(
    BarController,
    LineController,
    DoughnutController,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Tooltip,
    Legend,
    Filler,
  );

  registered = true;
};
