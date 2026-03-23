import { SearchForm } from "@/components/search-form";

export default function Home() {
  return (
    <div>
      <section className="bg-gradient-to-br from-[#1e3a5f] to-[#2d6aa0] py-16 px-4 text-center text-white">
        <h1 className="text-4xl font-bold mb-2">Where do you want to go?</h1>
        <p className="text-lg opacity-85 mb-8">
          Search flights and hotels across hundreds of destinations
        </p>
        <SearchForm />
      </section>
    </div>
  );
}
