"use client"

import React from "react"
import { useUserRoleAssignment } from "./LOGIC/useUserRoleAssignment"
import { UserRoleAssignmentDisplay } from "./UI/UserRoleAssignmentDisplay"

interface UserRoleAssignmentTabProps {
  selectedUserId?: string
}

/**
 * Komponen untuk manage role assignment user
 * Menangani assign, update, dan revoke role untuk user
 */
export function UserRoleAssignmentTab({ selectedUserId }: UserRoleAssignmentTabProps) {
  const userRoleAssignmentData = useUserRoleAssignment(selectedUserId)

  return (
    <UserRoleAssignmentDisplay {...userRoleAssignmentData} />
  )
}