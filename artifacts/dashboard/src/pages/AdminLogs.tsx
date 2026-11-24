import { useListLogs } from "@workspace/api-client-react";
import { Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AdminLogs() {
  const { data: logs, isLoading } = useListLogs({ limit: 50 });

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-xl font-bold text-white mb-6 cyber-glow-text flex items-center gap-2">
        <Activity className="text-[#00b4ff]" /> SYSTEM LOGS
      </h2>

      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center text-gray-500 py-10">Loading logs...</div>
        ) : logs?.length === 0 ? (
          <div className="text-center text-gray-500 py-10">No logs found</div>
        ) : (
          logs?.map((log) => (
            <div key={log.id} className="cyber-card p-3 border-l-2 border-l-[#00b4ff]">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-[#00b4ff]/10 text-[#00b4ff] border-[#00b4ff]/30 text-[10px] font-mono">
                    {log.action}
                  </Badge>
                  <span className="text-white font-bold text-sm">{log.username || "System"}</span>
                </div>
                <span className="text-[10px] text-gray-500 font-mono">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="text-sm text-gray-300">
                {log.detail}
              </div>
              {log.ip && (
                <div className="text-[10px] text-gray-500 mt-2 text-right">
                  IP: {log.ip}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
