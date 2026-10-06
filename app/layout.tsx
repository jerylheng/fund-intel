import "./globals.css"; import type {Metadata} from "next";
export const metadata:Metadata={title:"Fund Intel — AIA Fund Intelligence",description:"Independent AIA ILP fund research, comparison and investment projection tool."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}