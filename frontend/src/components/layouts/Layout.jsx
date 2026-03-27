import React, { useState } from 'react'
import SideNav from '../ui/SideNav'
import TopBar from '../ui/TopBar'
import Breadcrumbs from '../ui/Breadcrumbs'
import CartDrawer from '../shared/CartDrawer'
import { Outlet } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const toggleCart = () => setIsCartOpen(!isCartOpen);

    return (
        <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block">
                <SideNav />
            </div>
            <AnimatePresence>
                {isSidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={toggleSidebar}
                            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
                        />
                        <motion.div
                            initial={{ x: -300 }}
                            animate={{ x: 0 }}
                            exit={{ x: -300 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 left-0 z-50 lg:hidden"
                        >
                            <SideNav onClose={toggleSidebar} />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <TopBar onMenuClick={toggleSidebar} onCartClick={toggleCart} />
                <Breadcrumbs />
                <main className="flex-1 overflow-y-auto scrollbar-hide">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

export default Layout