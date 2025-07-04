import { useState } from "react";
import { User, LogOut, Menu, CreditCard, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreditBalance } from "@/components/CreditBalance";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MobileDropdownProps {
  user: any;
  onSignOut: () => void;
}

export const MobileDropdown = ({ user, onSignOut }: MobileDropdownProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="p-2">
          <Menu className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="pb-2">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span className="text-sm truncate">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <Link to="/connect-accounts" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Connect Accounts</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CreditCard className="w-4 h-4" />
            <span>Balance</span>
          </div>
          <CreditBalance />
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={onSignOut} className="flex items-center space-x-2">
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};