import * as ContextMenu from "@radix-ui/react-context-menu";
import { Cross1Icon } from "@radix-ui/react-icons";
import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import { itemVariants } from "../helpers/animationVariants";
import { Spinner } from "./Spinner";

export const CompactBookmark = ({
  bookmark,
  onRemove,
}: {
  bookmark: {
    createdAt: Date;
    id: string;
    title: string;
    url: string;
    faviconUrl: string | null;
    ogImageUrl: string | null;
    loading?: boolean;
    onClick?: () => void;
  };
  onRemove?: (id: string) => void;
}) => {
  const [isHovering, setIsHovering] = useState("");
  const [faviconError, setFaviconError] = useState(false);

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>
        <motion.li
          variants={itemVariants}
          key={bookmark.id}
          onHoverStart={() => {
            setIsHovering(bookmark.id);
          }}
          onHoverEnd={() => {
            setIsHovering("");
          }}
          className="hover:cursor-pointer"
          onClick={() => {
            if (bookmark.onClick) {
              bookmark.onClick();
              return;
            }

            window.open(bookmark.url, "_blank");
          }}
        >
          <motion.div
            whileTap={{ scale: 0.98 }}
            className="flex p-3 align-middle transition duration-200 ease-out rounded-2xl mb-1 hover:bg-black/5 hover:dark:bg-white/5"
          >
            <div className="flex w-full items-center justify-between align-middle">
              <div className="flex flex-row items-center gap-3 align-middle">
                {bookmark.loading ? (
                  <motion.div className="min-h-[1.9rem] min-w-[1.9rem] rounded-lg bg-black/10 p-2 dark:bg-white/10 flex items-center justify-center">
                    <Spinner size="sm" />
                  </motion.div>
                ) : bookmark.faviconUrl ? (
                  <motion.div className="min-h-[1.9rem] min-w-[1.9rem] rounded-lg bg-black/10 p-2 dark:bg-white/10">
                    <Image
                      src={
                        faviconError ? "/images/logo.png" : bookmark.faviconUrl
                      }
                      alt={bookmark.title}
                      width={12}
                      height={12}
                      sizes="24px"
                      style={{
                        height: "0.9rem",
                        width: "0.9rem",
                        borderRadius: "0.2rem",
                      }}
                      onError={() => {
                        setFaviconError(true);
                      }}
                    />
                  </motion.div>
                ) : (
                  <div
                    className="rounded-lg bg-gradient-to-br from-[#d2d1d1] to-[#dad7d7] dark:from-[#1a1a1a] dark:to-[#2d2c2c]"
                    style={{ height: "1.9rem", width: "1.9rem" }}
                  />
                )}
                <motion.p
                  animate={{ opacity: 1 }}
                  initial={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`lg:max-w-[24rem] md:max-w-[22rem] sm:max-w-[22rem] max-w-[13rem] truncate font-semibold text-black dark:text-white`}
                >
                  {bookmark.title}
                </motion.p>
                <p className="hidden lg:max-w-[18rem] md:max-w-[10rem] truncate text-sm text-zinc-500 md:block">
                  {bookmark.url}
                </p>
              </div>
            </div>
            {onRemove && bookmark.id !== "temp" && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                initial={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                animate={
                  isHovering
                    ? { opacity: 1, transition: { delay: 0.2 } }
                    : { opacity: 0 }
                }
                exit={{ opacity: 0 }}
                className="z-50 pr-2 font-bold text-zinc-500 duration-300 ease-in-out hover:text-black dark:hover:text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove ? onRemove(bookmark.id) : null;
                }}
              >
                <Cross1Icon className="h-4 w-4" />
              </motion.button>
            )}
          </motion.div>
        </motion.li>
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content className="z-50 rounded-md bg-black/10 px-4 py-2 align-middle no-underline backdrop-blur-lg transition duration-300 ease-in-out hover:cursor-pointer hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20">
          <ContextMenu.Item
            className="text-black outline-none focus:outline-none dark:text-white"
            onClick={() => {
              void navigator.clipboard.writeText(bookmark.url);
            }}
          >
            <p>Copy link</p>
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
};
