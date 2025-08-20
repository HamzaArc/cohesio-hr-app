import React from 'react';
import { Link } from 'react-router-dom';
import LandingHeader from '../components/LandingHeader';
import LandingFooter from '../components/LandingFooter';
import { DollarSign, Clock, Users, BarChart2, Star } from 'lucide-react';

const FeatureCard = ({ icon, title, description }) => (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow">
        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-600 mb-4">
            {icon}
        </div>
        <h3 className="text-lg font-bold text-gray-800">{title}</h3>
        <p className="mt-2 text-gray-600">{description}</p>
    </div>
);

function LandingPage() {
    return (
        <div className="bg-white">
            <LandingHeader />
            <main>
                {/* Hero Section */}
                <section className="relative h-screen flex items-center justify-center text-center text-white">
                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2940&auto=format&fit=crop')" }}></div>
                    <div className="absolute inset-0 bg-black/60"></div>
                    <div className="relative z-10 px-4">
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">The All-In-One HR Platform for Your Business</h1>
                        <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-gray-200">
                            From payroll to time off, manage all your people operations in one place. Built for small companies in emerging economies.
                        </p>
                        <div className="mt-8 flex justify-center gap-4">
                            <Link to="/signup" className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-transform hover:scale-105">
                                Get Started for Free
                            </Link>
                            <a href="#" className="bg-white/20 backdrop-blur-md text-white font-bold py-3 px-6 rounded-lg hover:bg-white/30 transition-colors">
                                Request a Demo
                            </a>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-20 bg-gray-50">
                    <div className="container mx-auto px-6 text-center">
                        <h2 className="text-3xl font-bold text-gray-800">Everything you need to manage your team</h2>
                        <p className="mt-2 text-lg text-gray-600">Focus on your people, not your paperwork.</p>
                        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <FeatureCard icon={<DollarSign />} title="Payroll" description="Run payroll accurately and on time with just a few clicks." />
                            <FeatureCard icon={<Clock />} title="Time Tracking" description="Manage timesheets, approvals, and project tracking effortlessly." />
                            <FeatureCard icon={<Users />} title="People Hub" description="A central, organized directory for all your employee information." />
                            <FeatureCard icon={<BarChart2 />} title="Performance" description="Conduct meaningful reviews and track employee growth over time." />
                        </div>
                    </div>
                </section>

                {/* Testimonial Section */}
                <section className="py-20 bg-white">
                    <div className="container mx-auto px-6 max-w-4xl text-center">
                        <div className="flex justify-center text-yellow-400 mb-4">
                            {[...Array(5)].map((_, i) => <Star key={i} fill="currentColor" />)}
                        </div>
                        <p className="text-2xl font-semibold text-gray-800 italic">
                            "Cohesio has been a game-changer for our startup. We've saved countless hours on HR admin, allowing us to focus on growing our business. It’s simple, powerful, and affordable."
                        </p>
                        <div className="mt-6">
                            <p className="font-bold text-gray-900">Aisha Bello</p>
                            <p className="text-gray-500">CEO, TechStart Africa</p>
                        </div>
                    </div>
                </section>

                {/* Final CTA Section */}
                <section className="bg-gray-800">
                    <div className="container mx-auto px-6 py-16 text-center">
                        <h2 className="text-3xl font-bold text-white">Ready to transform your HR?</h2>
                        <p className="mt-2 text-lg text-gray-300">Join hundreds of growing businesses on Cohesio today.</p>
                        <div className="mt-8">
                            <Link to="/signup" className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition-transform hover:scale-105">
                                Sign Up Now
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
            <LandingFooter />
        </div>
    );
}

export default LandingPage;