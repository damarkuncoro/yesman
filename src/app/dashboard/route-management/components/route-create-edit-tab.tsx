"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/shadcn/ui/button";
import { Input } from "@/components/shadcn/ui/input";
import { Label } from "@/components/shadcn/ui/label";
import { Textarea } from "@/components/shadcn/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shadcn/ui/card";
import { Badge } from "@/components/shadcn/ui/badge";
import { Switch } from "@/components/shadcn/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/ui/select";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/shadcn/ui/form";
import { Checkbox } from "@/components/shadcn/ui/checkbox";
import {
  IconArrowLeft,
  IconDeviceFloppy,
  IconPlus,
  IconTrash,
  IconRoute,
  IconAlertCircle,
  IconMinus,
} from "@tabler/icons-react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

interface Feature {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}

interface Role {
  id: string;
  name: string;
  description: string;
  userCount: number;
}

interface RouteCreateEditTabProps {
  routeId?: string | null;
  isEditMode?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
  onBack?: () => void;
  onSave?: (routeData: any) => void;
}

// Schema validasi form menggunakan Zod
const routeFormSchema = z.object({
  path: z.string().min(1, "Path harus diisi").regex(/^\//, "Path harus dimulai dengan /"),
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
  featureId: z.string().min(1, "Feature harus dipilih"),
  description: z.string().min(1, "Deskripsi harus diisi"),
  isActive: z.boolean().default(true),
  roleIds: z.array(z.string()).min(1, "Minimal satu role harus dipilih"),
  policies: z.array(z.object({
    name: z.string().min(1, "Nama policy harus diisi"),
    type: z.enum(["allow", "deny"]),
    conditions: z.array(z.string())
  }))
});

type RouteFormValues = z.infer<typeof routeFormSchema>;

/**
 * Komponen untuk create dan edit route
 * Menyediakan form lengkap untuk konfigurasi route, feature assignment, dan role access
 */
export function RouteCreateEditTab({
  routeId,
  isEditMode: propIsEditMode,
  onSuccess,
  onCancel,
  onBack,
  onSave,
}: RouteCreateEditTabProps) {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const isEditMode = propIsEditMode ?? !!routeId;

  // Setup form dengan react-hook-form dan validasi Zod
  const form = useForm({
    resolver: zodResolver(routeFormSchema),
    defaultValues: {
      path: "",
      method: "GET",
      featureId: "",
      description: "",
      isActive: true,
      roleIds: [],
      policies: []
    }
  });

  /**
   * Update policy
   */
  const updatePolicy = (index: number, field: string, value: any) => {
    const currentPolicies = form.getValues("policies");
    const updatedPolicies = [...currentPolicies];
    updatedPolicies[index] = { ...updatedPolicies[index], [field]: value };
    form.setValue("policies", updatedPolicies);
  };

  /**
   * Add policy condition
   */
  const addPolicyCondition = (policyIndex: number) => {
    const currentPolicies = form.getValues("policies");
    const updatedPolicies = [...currentPolicies];
    updatedPolicies[policyIndex].conditions.push("");
    form.setValue("policies", updatedPolicies);
  };

  /**
   * Update policy condition
   */
  const updatePolicyCondition = (policyIndex: number, conditionIndex: number, value: string) => {
    const currentPolicies = form.getValues("policies");
    const updatedPolicies = [...currentPolicies];
    updatedPolicies[policyIndex].conditions[conditionIndex] = value;
    form.setValue("policies", updatedPolicies);
  };

  /**
   * Remove policy condition
   */
  const removePolicyCondition = (policyIndex: number, conditionIndex: number) => {
    const currentPolicies = form.getValues("policies");
    const updatedPolicies = [...currentPolicies];
    updatedPolicies[policyIndex].conditions.splice(conditionIndex, 1);
    form.setValue("policies", updatedPolicies);
  };

  /**
   * Load data features, roles, dan route (jika edit mode)
   */
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Simulasi API call untuk features
        const dummyFeatures: Feature[] = [
          {
            id: "user_management",
            name: "User Management",
            description: "Manage users and user data",
            isActive: true,
          },
          {
            id: "role_management",
            name: "Role Management",
            description: "Manage roles and permissions",
            isActive: true,
          },
          {
            id: "feature_management",
            name: "Feature Management",
            description: "Manage application features",
            isActive: true,
          },
          {
            id: "route_management",
            name: "Route Management",
            description: "Manage API routes and access",
            isActive: true,
          },
        ];

        // Simulasi API call untuk roles
        const dummyRoles: Role[] = [
          {
            id: "admin",
            name: "Administrator",
            description: "Full system access",
            userCount: 5,
          },
          {
            id: "manager",
            name: "Manager",
            description: "Management level access",
            userCount: 12,
          },
          {
            id: "user",
            name: "Regular User",
            description: "Standard user access",
            userCount: 150,
          },
          {
            id: "guest",
            name: "Guest",
            description: "Limited access",
            userCount: 0,
          },
        ];

        setFeatures(dummyFeatures);
        setRoles(dummyRoles);

        // Jika edit mode, load data route
        if (isEditMode && routeId) {
          // Simulasi load route data
          const routeData = {
            path: "/api/users/:id",
            method: "GET" as const,
            featureId: "user_management",
            description: "Get user by ID with detailed information",
            isActive: true,
            roleIds: ["admin", "manager", "user"],
            policies: [
              {
                name: "User Access Policy",
                type: "allow" as const,
                conditions: ["authenticated", "user_scope"],
              },
            ],
          };
          
          form.reset(routeData);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [routeId, isEditMode, form]);

  // Handler untuk submit form
  const onSubmit = async (values: any) => {
    setIsSaving(true);
    try {
      // Simulasi API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log("Route data:", values);
      onSave?.(values);
      onSuccess?.();
    } catch (error) {
      console.error("Error saving route:", error);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Add new policy
   */
  const addPolicy = () => {
    const currentPolicies = form.getValues("policies");
    form.setValue("policies", [
      ...currentPolicies,
      {
        name: "",
        type: "allow" as const,
        conditions: []
      }
    ]);
  };

  /**
   * Remove policy
   */
  const removePolicy = (index: number) => {
    const currentPolicies = form.getValues("policies");
    form.setValue(
      "policies",
      currentPolicies.filter((_, i) => i !== index)
    );
  };

  /**
   * Get badge color berdasarkan HTTP method
   */
  const getMethodBadgeColor = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "POST":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "PUT":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      case "DELETE":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      case "PATCH":
        return "bg-purple-100 text-purple-800 hover:bg-purple-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <IconRoute className="mx-auto h-12 w-12 text-muted-foreground mb-4 animate-pulse" />
            <p className="text-muted-foreground">Loading form data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <IconArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {isEditMode ? "Edit Route" : "Create New Route"}
          </h2>
          <p className="text-muted-foreground">
            {isEditMode
              ? "Update route configuration and access control"
              : "Configure new route with feature assignment and role access"}
          </p>
        </div>
      </div>

      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Method */}
                <FormField
                  control={form.control}
                  name="method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>HTTP Method</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {["GET", "POST", "PUT", "DELETE", "PATCH"].map(
                            (method) => (
                              <SelectItem key={method} value={method}>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant="secondary"
                                    className={getMethodBadgeColor(method)}
                                  >
                                    {method}
                                  </Badge>
                                </div>
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Path */}
                <FormField
                  control={form.control}
                  name="path"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Route Path</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="/api/users/:id"
                          {...field}
                          className="font-mono"
                        />
                      </FormControl>
                      <FormDescription>
                        Use :param for path parameters (e.g., /api/users/:id)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Feature Assignment */}
              <FormField
                control={form.control}
                name="featureId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign to Feature</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select feature" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {features
                          .filter((feature) => feature.isActive)
                          .map((feature) => (
                            <SelectItem key={feature.id} value={feature.id}>
                              <div>
                                <p className="font-medium">{feature.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {feature.description}
                                </p>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe what this route does..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Active Status */}
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Status</FormLabel>
                      <FormDescription>
                        Enable or disable this route
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Role Access */}
          <Card>
            <CardHeader>
              <CardTitle>Role Access</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="roleIds"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">Select Roles</FormLabel>
                      <FormDescription>
                        Choose which roles can access this route
                      </FormDescription>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {roles.map((role) => (
                        <FormField
                          key={role.id}
                          control={form.control}
                          name="roleIds"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={role.id}
                                className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(role.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, role.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== role.id
                                            )
                                          );
                                    }}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel className="font-medium">
                                    {role.name}
                                  </FormLabel>
                                  <p className="text-sm text-muted-foreground">
                                    {role.description}
                                  </p>
                                  <Badge variant="outline" className="text-xs">
                                    {role.userCount} users
                                  </Badge>
                                </div>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Policies */}
          <Card>
            <CardHeader>
              <CardTitle>Access Policies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing Policies */}
              <FormField
                control={form.control}
                name="policies"
                render={({ field }) => (
                  <FormItem>
                    <div className="space-y-2">
                      {field.value.map((policy, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{policy.name}</span>
                              <Badge
                                variant={
                                  policy.type === "allow" ? "default" : "destructive"
                                }
                              >
                                {policy.type}
                              </Badge>
                            </div>
                            {policy.conditions.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {policy.conditions.map((condition, condIndex) => (
                                  <Badge
                                    key={condIndex}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {condition}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removePolicy(index)}
                          >
                            <IconTrash className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </FormItem>
                )}
              />

              {/* Add New Policy */}
              <div className="border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={addPolicy}
                >
                  <IconPlus className="h-4 w-4 mr-2" />
                  Add Policy
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onCancel || onBack}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <IconAlertCircle className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <IconDeviceFloppy className="h-4 w-4 mr-2" />
                  {isEditMode ? "Update Route" : "Create Route"}
                </>
              )}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}