import { useGetStats } from "@workspace/api-client-react";
import { BarChart3, Users, Wifi, AlertTriangle, Wrench } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminStats() {
  const { data: stats, isLoading } = useGetStats();

  if (isLoading) {
    return <div className="p-4 text-center text-[#00b4ff]">Loading statistics...</div>;
  }

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-xl font-bold text-white mb-6 cyber-glow-text flex items-center gap-2">
        <BarChart3 className="text-[#00b4ff]" /> PLATFORM STATISTICS
      </h2>

      <div className="grid grid-cols-2 gap-4">
        <Card className="cyber-card">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <Users className="w-8 h-8 text-[#00b4ff] mb-2" />
            <div className="text-2xl font-bold text-white">{stats?.totalUsers || 0}</div>
            <div className="text-xs text-gray-400 mt-1">TOTAL USERS</div>
          </CardContent>
        </Card>
        
        <Card className="cyber-card">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <Wifi className="w-8 h-8 text-green-500 mb-2" />
            <div className="text-2xl font-bold text-white">{stats?.activeUsers || 0}</div>
            <div className="text-xs text-gray-400 mt-1">ACTIVE USERS</div>
          </CardContent>
        </Card>
        
        <Card className="cyber-card border-red-500/30">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <AlertTriangle className="w-8 h-8 text-red-500 mb-2" />
            <div className="text-2xl font-bold text-white">{stats?.bannedUsers || 0}</div>
            <div className="text-xs text-gray-400 mt-1">BANNED USERS</div>
          </CardContent>
        </Card>
        
        <Card className="cyber-card">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <Wrench className="w-8 h-8 text-purple-500 mb-2" />
            <div className="text-2xl font-bold text-white">{stats?.toolsUsed || 0}</div>
            <div className="text-xs text-gray-400 mt-1">TOOLS USED</div>
          </CardContent>
        </Card>
      </div>

      {stats?.popularTools && stats.popularTools.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-bold text-white mb-4 tracking-wider">POPULAR TOOLS</h3>
          <div className="space-y-3">
            {stats.popularTools.map((item, idx) => (
              <div key={idx} className="glass-panel p-3 rounded-lg flex items-center justify-between">
                <span className="text-white text-sm font-bold">{item.toolName || item.toolId}</span>
                <span className="text-[#00b4ff] font-mono text-sm">{item.count} usages</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
