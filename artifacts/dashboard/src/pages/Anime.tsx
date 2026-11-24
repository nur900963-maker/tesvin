import { useState } from "react";
import { useSearchAnime, useGetTrendingAnime } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Play, Search, Star, Tv } from "lucide-react";

export default function Anime() {
  const [search, setSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  
  const { data: trendingData, isLoading: isLoadingTrending } = useGetTrendingAnime();
  const { data: searchData, isLoading: isLoadingSearch, refetch } = useSearchAnime(
    { q: search || " " },
    { query: { enabled: false, queryKey: ["searchAnime", search] } }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      setIsSearching(true);
      refetch();
    } else {
      setIsSearching(false);
    }
  };

  const displayData = isSearching && searchData ? searchData : trendingData;
  const isLoading = isSearching ? isLoadingSearch : isLoadingTrending;

  return (
    <div className="p-4 space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#00b4ff]/10 border border-[#00b4ff]/50 mb-3 shadow-[0_0_15px_rgba(0,180,255,0.4)]">
          <Tv className="w-6 h-6 text-[#00b4ff]" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-widest cyber-glow-text flex items-center justify-center gap-2">
          ANIME STATION
        </h2>
        <p className="text-xs text-[#00b4ff] font-mono mt-1">STREAMING & DATABASE SYSTEM</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Search anime..." 
            className="cyber-input pl-10 bg-black/60"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button type="submit" className="cyber-button px-6">Search</Button>
      </form>

      <div>
        <h3 className="text-lg font-bold text-white mb-4 tracking-wider flex items-center gap-2">
          <Play className="w-5 h-5 text-[#00b4ff] fill-[#00b4ff]" /> 
          {isSearching ? "SEARCH RESULTS" : "TRENDING NOW"}
        </h3>
        
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="rounded-xl bg-gray-900/50 h-64 animate-pulse border border-[#00b4ff]/10"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {displayData?.map((anime) => (
              <div key={anime.id} className="cyber-card group overflow-hidden bg-black/60 border border-[#00b4ff]/20 flex flex-col h-full">
                <div className="relative h-48 w-full shrink-0 overflow-hidden">
                  <img 
                    src={anime.image || "https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?w=400&q=80"} 
                    alt={anime.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>
                  
                  {anime.score && (
                    <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm border border-yellow-500/50 rounded-full px-2 py-1 flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      <span className="text-white text-xs font-bold">{anime.score}</span>
                    </div>
                  )}
                  
                  {anime.type && (
                    <div className="absolute bottom-2 left-2 bg-[#00b4ff]/80 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                      {anime.type}
                    </div>
                  )}
                </div>
                
                <div className="p-3 flex-1 flex flex-col">
                  <h4 className="text-white font-bold text-sm line-clamp-2 mb-1 group-hover:text-[#00b4ff] transition-colors">
                    {anime.title}
                  </h4>
                  <div className="text-xs text-gray-400 mt-auto flex justify-between">
                    <span>{anime.year || "N/A"}</span>
                    <span>{anime.episodes ? `${anime.episodes} EPS` : ""}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-center mt-8 pb-4">
        <p className="text-[10px] text-gray-500 font-mono">Dev @pakvncnt | Channel: @testipakvncnt</p>
      </div>
    </div>
  );
}
