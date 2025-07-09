"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { accountFormSchema } from "@/src/lib/validation/accountFormSchema";
import type { AccountFormData } from "@/src/lib/validation/accountFormData";

import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Button } from "@/src/components/ui/button";
import { SimpleSelect } from "@/src/components/ui/select";

import { useUserProfile } from "@/src/hooks/useUserProfile";
import { useUserPreferences } from "@/src/hooks/useUserPreferences";
import { useUserLocation } from "@/src/hooks/useUserLocation";

export default function AccountForm() {
  const { user, update } = useUserProfile();
  const { preferences, updatePreferences } = useUserPreferences(user?.uid);
  const { location, updateLocation } = useUserLocation(user?.uid);

  const form = useForm<AccountFormData>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      ...user,
      preferences: preferences,
      lastKnownLocation: location ?? undefined,
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (user) {
      for (const key of [
        "firstName",
        "lastName",
        "name",
        "gender",
        "dateOfBirth",
        "idNumber",
        "phone",
        "address",
        "city",
        "state",
        "zip",
        "country",
      ] as const) {
        if (user[key]) setValue(key, user[key]);
      }
    }
    if (preferences) {
      setValue("preferences", preferences);
    }
    if (location) {
      setValue("lastKnownLocation", location);
    }
  }, [user, preferences, location, setValue]);

  const onSubmit = async (data: AccountFormData) => {
    if (!user?.uid) return;
    const {
      preferences: pref,
      lastKnownLocation,
      ...profileFields
    } = data;
    await update(profileFields);
    await updatePreferences(pref);
    if (lastKnownLocation) await updateLocation(lastKnownLocation);
    alert("Profile updated successfully.");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label>First Name</Label>
        <Input {...register("firstName")} />
      </div>
      <div>
        <Label>Last Name</Label>
        <Input {...register("lastName")} />
      </div>
      <div className="md:col-span-2">
        <Label>Full Name</Label>
        <Input {...register("name")} />
      </div>
      <div>
        <Label>Gender</Label>
        <SimpleSelect
          value={form.watch("gender")}
          onChange={(val) => setValue("gender", val as any)}
          options={[
            { label: "Male", value: "male" },
            { label: "Female", value: "female" },
            { label: "Other", value: "other" },
          ]}
        />
      </div>
      <div>
        <Label>Date of Birth</Label>
        <Input type="date" {...register("dateOfBirth")} />
      </div>
      <div>
        <Label>ID Number</Label>
        <Input {...register("idNumber")} />
      </div>
      <div>
        <Label>Phone</Label>
        <Input {...register("phone")} />
      </div>
      <div className="md:col-span-2">
        <Label>Address</Label>
        <Input {...register("address")} />
      </div>
      <div>
        <Label>City</Label>
        <Input {...register("city")} />
      </div>
      <div>
        <Label>State</Label>
        <Input {...register("state")} />
      </div>
      <div>
        <Label>ZIP</Label>
        <Input {...register("zip")} />
      </div>
      <div>
        <Label>Country</Label>
        <Input {...register("country")} />
      </div>

      <div>
        <Label>Language</Label>
        <SimpleSelect
          value={form.watch("preferences.language")}
          onChange={(val) =>
            setValue("preferences", {
              ...form.watch("preferences"),
              language: val,
            })
          }
          options={[
            { label: "English", value: "en" },
            { label: "Vietnamese", value: "vi" },
            { label: "Korean", value: "ko" },
          ]}
        />
      </div>
      <div>
        <Label>Region</Label>
        <SimpleSelect
          value={form.watch("preferences.region")}
          onChange={(val) =>
            setValue("preferences", {
              ...form.watch("preferences"),
              region: val,
            })
          }
          options={[
            { label: "Vietnam", value: "VN" },
            { label: "South Korea", value: "KR" },
            { label: "United States", value: "US" },
          ]}
        />
      </div>
      <div>
        <Label>Currency</Label>
        <SimpleSelect
          value={form.watch("preferences.currency") || ""}
          onChange={(val) =>
            setValue("preferences", {
              ...form.watch("preferences"),
              currency: val,
            })
          }
          options={[
            { label: "VND", value: "VND" },
            { label: "USD", value: "USD" },
            { label: "KRW", value: "KRW" },
          ]}
        />
      </div>

      <div className="md:col-span-2">
        <Label>Last Known Address</Label>
        <Input
          value={form.watch("lastKnownLocation.address") || ""}
          onChange={(e) =>
            setValue("lastKnownLocation", {
              ...form.watch("lastKnownLocation"),
              address: e.target.value,
            })
          }
        />
      </div>
      <div>
        <Label>Latitude</Label>
        <Input
          value={form.watch("lastKnownLocation.lat")?.toString() || ""}
          onChange={(e) =>
            setValue("lastKnownLocation", {
              ...form.watch("lastKnownLocation"),
              lat: parseFloat(e.target.value) || 0,
            })
          }
        />
      </div>
      <div>
        <Label>Longitude</Label>
        <Input
          value={form.watch("lastKnownLocation.lng")?.toString() || ""}
          onChange={(e) =>
            setValue("lastKnownLocation", {
              ...form.watch("lastKnownLocation"),
              lng: parseFloat(e.target.value) || 0,
            })
          }
        />
      </div>

      <div className="md:col-span-2 flex gap-4 mt-6">
        <Button type="submit">Save</Button>
        <Button type="button" variant="ghost">
          Cancel
        </Button>
      </div>
    </form>
  );
}
