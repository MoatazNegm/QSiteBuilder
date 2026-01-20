import React, { useState, useEffect } from 'react';
import { db, doc, onSnapshot, setDoc, getDoc } from '../firebase';
import { Check, X, AlertTriangle, Globe, ArrowRight } from 'lucide-react';

const SITE_DOC_ID = import.meta.env.VITE_SITE_DOC_ID;
const IS_STAGING = SITE_DOC_ID === 'quickstor-staging';

export default function StagingBanner() {
    const [stagingVersion, setStagingVersion] = useState(null);
    const [liveVersion, setLiveVersion] = useState(null);
    const [loading, setLoading] = useState(IS_STAGING);
    const [processing, setProcessing] = useState(false);

    // If not staging, don't render anything
    if (!IS_STAGING) return null;

    useEffect(() => {
        // Listen to Staging
        const unsubStaging = onSnapshot(doc(db, 'sites', 'quickstor-staging'), (doc) => {
            if (doc.exists()) {
                setStagingVersion(doc.data().version);
            }
        });

        // Listen to Live
        const unsubLive = onSnapshot(doc(db, 'sites', 'quickstor-live'), (doc) => {
            if (doc.exists()) {
                setLiveVersion(doc.data().version);
            }
        });

        setLoading(false);

        return () => {
            unsubStaging();
            unsubLive();
        };
    }, []);

    const hasPendingPublish = stagingVersion && (!liveVersion || stagingVersion !== liveVersion);

    const handlePublishLive = async () => {
        if (!confirm("Are you sure you want to publish the current Staging content to the LIVE website?")) return;

        setProcessing(true);
        try {
            // 1. Get current staging data
            const stagingSnap = await getDoc(doc(db, 'sites', 'quickstor-staging'));
            if (!stagingSnap.exists()) throw new Error("No staging content found.");
            const data = stagingSnap.data();

            // 2. Write to live
            await setDoc(doc(db, 'sites', 'quickstor-live'), {
                ...data,
                lastPublished: new Date()
            });

            alert('Successfully published to Live!');
        } catch (error) {
            console.error('Error publishing to live:', error);
            alert('Failed to publish: ' + error.message);
        } finally {
            setProcessing(false);
        }
    };

    const handleRejectStaging = async () => {
        if (!confirm("Are you sure? This will overwrite STAGING with LIVE content. You will lose unsaved work.")) return;

        setProcessing(true);
        try {
            // 1. Get current live data
            const liveSnap = await getDoc(doc(db, 'sites', 'quickstor-live'));
            if (!liveSnap.exists()) throw new Error("No live content found.");
            const data = liveSnap.data();

            // 2. Overwrite staging
            await setDoc(doc(db, 'sites', 'quickstor-staging'), data);

            alert('Staging reverted to match Live.');
        } catch (error) {
            console.error('Error reverting staging:', error);
            alert('Failed to revert: ' + error.message);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return null;

    return (
        <div className="fixed top-0 left-0 right-0 h-12 bg-gray-900 border-b border-gray-800 z-[100] flex items-center justify-between px-4 sm:px-6 shadow-lg">
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-2 py-0.5 rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs font-bold uppercase tracking-wider">
                    <AlertTriangle size={12} />
                    <span>Staging Environment</span>
                </div>

                {hasPendingPublish ? (
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                        <span>You have unpublished changes</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        <span>Synced with Live</span>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-3">
                {hasPendingPublish && (
                    <>
                        <button
                            onClick={handleRejectStaging}
                            disabled={processing}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
                            title="Discard Staging changes and reset to Live version"
                        >
                            <X size={14} />
                            Reject & Reset
                        </button>

                        <div className="h-4 w-px bg-gray-700"></div>

                        <button
                            onClick={handlePublishLive}
                            disabled={processing}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-green-600 hover:bg-green-500 rounded shadow-sm hover:shadow transition-all disabled:opacity-50"
                            title="Deploy Staging verification to Live"
                        >
                            <Check size={14} />
                            Deploy to Live
                        </button>
                    </>
                )}

                {!hasPendingPublish && (
                    <a
                        href="https://quickstor-live.web.app" // Replace with actual live URL if known, or generic
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white transition-colors"
                    >
                        View Live Site <Globe size={14} />
                    </a>
                )}
            </div>
        </div>
    );
}
