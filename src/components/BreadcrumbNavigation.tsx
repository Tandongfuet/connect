import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface BreadcrumbPath {
    name: string;
    path?: string;
}

interface BreadcrumbNavigationProps {
    paths: BreadcrumbPath[];
}

const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({ paths }) => {
    const navigate = useNavigate();

    return (
        <nav className="flex items-center justify-between mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm">
                <li>
                    <Link to="/" className="text-gray-500 hover:text-primary dark:text-dark-muted dark:hover:text-primary-light">Home</Link>
                </li>
                {paths.map((path, index) => (
                    <li key={index} className="flex items-center">
                        <svg className="h-5 w-5 flex-shrink-0 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                            <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                        </svg>
                        {path.path ? (
                            <Link to={path.path} className="ml-2 text-gray-500 hover:text-primary dark:text-dark-muted dark:hover:text-primary-light">{path.name}</Link>
                        ) : (
                            <span className="ml-2 font-medium text-slate-dark dark:text-white">{path.name}</span>
                        )}
                    </li>
                ))}
            </ol>
            <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm inline-flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
            </button>
        </nav>
    );
};

export default BreadcrumbNavigation;