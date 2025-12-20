import React, { useState, useEffect } from "react";
import api from "../api/axios"; // Uses existing axios instance with JWT
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // FIX: Initialize with empty strings to prevent "controlled to uncontrolled" warnings
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    cgpa: "",
    college: "",
    degree: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/users/profile");
        if (res.data) {
          // Safeguard: Ensure no field is null/undefined when setting state
          setFormData({
            id: res.data.id || undefined,
            name: res.data.name || "",
            email: res.data.email || "",
            cgpa: res.data.cgpa || "",
            college: res.data.college || "",
            degree: res.data.degree || "",
          });
        }
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post("/users/profile", formData);
      alert("Profile and Academic records synced successfully!");
    } catch (err) {
      console.error("Save error:", err);
      alert("Error saving profile: " + (err.response?.data?.error || "Unauthorized"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">User Profile</CardTitle>
          <CardDescription>
            Update your academic details. These will be automatically synced with your scholarship applications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Full Name</label>
            <Input 
              placeholder="Enter your name" 
              value={formData.name} 
              onChange={(e) => setFormData({...formData, name: e.target.value})} 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Email Address (Read-only)</label>
            <Input 
              value={formData.email} 
              disabled 
              className="bg-slate-50"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Current CGPA</label>
              <Input 
                placeholder="e.g. 8.5" 
                type="number" 
                step="0.01"
                value={formData.cgpa} 
                onChange={(e) => setFormData({...formData, cgpa: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Degree / Major</label>
              <Input 
                placeholder="e.g. B.Tech CSE" 
                value={formData.degree} 
                onChange={(e) => setFormData({...formData, degree: e.target.value})} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">College / University</label>
            <Input 
              placeholder="Enter your institution name" 
              value={formData.college} 
              onChange={(e) => setFormData({...formData, college: e.target.value})} 
            />
          </div>

          <Button 
            onClick={handleSave} 
            className="w-full bg-indigo-600 hover:bg-indigo-700"
            disabled={saving}
          >
            {saving ? "Syncing..." : "Save & Sync Academic Data"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}