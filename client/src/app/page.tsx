import CitySearchForm from './_components/CitySearchForm';

export default function Home() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
      }}
    >
      <CitySearchForm />
    </div>
  );
}
