"use client";

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import { useAuth } from "@/src/components/users/useAuth";
import { db } from "@/src/firebaseConfig";

import Header from "@/src/components/landingpage/Header";
import Footer from "@/src/components/landingpage/Footer";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { SimpleSelect } from "@/src/components/ui/select";
import UserTopMenu from "@/src/components/landingpage/UserTopMenu";
import { auth } from "@/src/firebaseConfig";

type UserData = {
  firstName?: string;
  lastName?: string;
  email?: string;
  homeAirport?: string;
  address?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  phone?: string;
};

export default function AccountPage() {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState<UserData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;
      const ref = doc(db, "users", currentUser.uid);
      const snapshot = await getDoc(ref);
      if (snapshot.exists()) {
        setUserData(snapshot.data() as UserData);
      }
      setLoading(false);
    };

    fetchUserData();
  }, [currentUser]);

  const handleChange = (field: keyof UserData, value: string) => {
    setUserData((prev) => ({ ...prev, [field]: value }));
  };

  const handleResetPassword = async () => {
    if (currentUser?.email) {
      try {
        await sendPasswordResetEmail(auth, currentUser.email);
        alert("A password reset email has been sent to your inbox.");
      } catch (err: unknown) {
        if (err instanceof Error) {
          alert(`Failed to send reset email: ${err.message}`);
        } else {
          alert("An unknown error occurred.");
        }
      }
    } else {
      alert("No email found for current user.");
    }
  };


  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <>
      <Header />
      <UserTopMenu />
      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-semibold mb-6 border-b-2 border-[#00d289] pb-2">Account Info</h2>

        <form className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-gray-300 p-6 rounded shadow-lg bg-white">
          <div>
            <Label htmlFor="firstName">First name</Label>
            <Input
              id="firstName"
              value={userData.firstName || ""}
              onChange={(e) => handleChange("firstName", e.target.value)}
              className="border border-gray-300 rounded p-2"
            />
          </div>

          <div>
            <Label htmlFor="lastName">Last name</Label>
            <Input
              id="lastName"
              value={userData.lastName || ""}
              onChange={(e) => handleChange("lastName", e.target.value)}
              className="border border-gray-300 rounded p-2"
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="homeAirport">Home airport</Label>
            <Input
              id="homeAirport"
              value={userData.homeAirport || ""}
              onChange={(e) => handleChange("homeAirport", e.target.value)}
              className="border border-gray-300 rounded p-2"
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={userData.email || ""} readOnly className="border border-gray-300 rounded p-2" />
            <p className="text-sm text-gray-500 mt-1">* primary email</p>
          </div>

          {/* 🔐 Password Section */}
          <div className="md:col-span-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="********" disabled className="border border-gray-300 rounded p-2" />
            <button
              type="button"
              onClick={handleResetPassword}
              className="text-sm text-[#00d289] mt-2 hover:underline"
            >
              Reset your password
            </button>
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="address">Street address</Label>
            <Input
              id="address"
              value={userData.address || ""}
              onChange={(e) => handleChange("address", e.target.value)}
              className="border border-gray-300 rounded p-2"
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="address2">Street address (continued)</Label>
            <Input
              id="address2"
              value={userData.address2 || ""}
              onChange={(e) => handleChange("address2", e.target.value)}
              className="border border-gray-300 rounded p-2"
            />
          </div>

          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={userData.city || ""}
              onChange={(e) => handleChange("city", e.target.value)}
              className="border border-gray-300 rounded p-2"
            />
          </div>

          <div>
            <Label htmlFor="state">State/Province/Region</Label>
            <SimpleSelect
              value={userData.state || ""}
              onChange={(val) => handleChange("state", val)}
              options={[
                { label: "Da Nang", value: "danang" },
                { label: "Ha Noi", value: "hanoi" },
                { label: "Ho Chi Minh", value: "hochiminh" },
              ]}
              placeholder="Select region"
            />
          </div>

          <div>
            <Label htmlFor="zip">ZIP code</Label>
            <Input
              id="zip"
              value={userData.zip || ""}
              onChange={(e) => handleChange("zip", e.target.value)}
              className="border border-gray-300 rounded p-2"
            />
          </div>

          <div>
            <Label htmlFor="country">Country</Label>
            <SimpleSelect
              value={userData.country || ""}
              onChange={(val) => handleChange("country", val)}
              options={[
                { label: "Vietnam", value: "vn" },
                { label: "United States", value: "us" },
                { label: "Korea", value: "kr" },
              ]}
              placeholder="Select country"
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone number</Label>
            <Input
              id="phone"
              value={userData.phone || ""}
              onChange={(e) => handleChange("phone", e.target.value)}
              className="border border-gray-300 rounded p-2"
            />
            <p className="text-sm text-gray-500 mt-1">Please enter numbers only</p>
          </div>

          <div className="md:col-span-2 flex gap-4 mt-6">
            <Button type="submit" className="border border-gray-300 rounded p-2">Save</Button>
            <Button variant="ghost" type="button" className="border border-gray-300 rounded p-2">Cancel</Button>
          </div>
        </form>
      </div>
      <Footer />
    </>
  );
}
