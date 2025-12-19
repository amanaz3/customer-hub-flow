import MainLayout from "@/components/Layout/MainLayout";
import { AIAssistantChat } from "@/components/AIAssistant/AIAssistantChat";

export default function AIAssistant() {
  return (
    <MainLayout>
      <div className="p-6">
        <AIAssistantChat />
      </div>
    </MainLayout>
  );
}
