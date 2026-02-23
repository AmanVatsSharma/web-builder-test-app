import React from "react";
import Image from "next/image";
import Link from "next/link";
import AccountButton from "@/components/AccountButton";
import { ModeToggle } from "@/components/global/ModeToggle";

const Navigation = () => {
    return (
        <div className="fixed top-0 right-0 left-0 p-4 flex items-center justify-between z-10">
            <aside className="flex items-center gap-2">
                <Image
                    src={"/assets/plura-logo.svg"}
                    alt="logo"
                    width={40}
                    height={40} />
                <span className="text-xl font-bold">W-Build</span>
            </aside>
            <nav className="hidden md:block absolute left-[50%] top-[50%] translate-x-[-50%] transform translate-y-[-50%]">
                <ul className="flex items-center-justify-center gap-8">
                    <Link href={'#'}>
                        Pricing
                    </Link>
                    <Link href={'#'}>
                        About
                    </Link>
                    <Link href={'#'}>
                        Documentation
                    </Link>
                    <Link href={'#'}>
                        Features
                    </Link>
                </ul>
            </nav>
            <aside className='flex gap-2 items-center'>
                <AccountButton />
                <ModeToggle />
            </aside>
        </div>
    )
}

export default Navigation