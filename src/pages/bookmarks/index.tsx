import { type Bookmark } from "@prisma/client";
import { PlusIcon } from "@radix-ui/react-icons";
import { AnimatePresence, motion } from "framer-motion";
import { useAtom } from "jotai";
import { type GetServerSideProps } from "next";
import { getSession, useSession } from "next-auth/react";
import Head from "next/head";
import { useCallback, useEffect, useState } from "react";
import { CompactBookmark } from "~/components/CompactBookmark";
import { CreateFolderButton } from "~/components/CreateFolderButton";
import { DeleteFolderButton } from "~/components/DeleteFolderButton";
import { EmptyState } from "~/components/EmptyState";
import { ExpandedBookmark } from "~/components/ExpandedBookmark";
import { FolderSkeleton } from "~/components/FolderSkeleton";
import { ProfileMenu } from "~/components/ProfileMenu";
import { Separator } from "~/components/Separator";
import { ShareButton } from "~/components/ShareButton";
import { SkeletonList } from "~/components/SkeletonList";
import { Spinner } from "~/components/Spinner";
import {
  currentFolderAtom,
  directionAtom,
  isOpenAtom,
  viewStyleAtom,
} from "~/helpers/atoms";
import { capitalizeFirstLetter } from "~/helpers/capitalizeFirstLetter";
import { getCommonFavicons, getWebsiteName } from "~/helpers/getCommonFavicons";
import { getFaviconForFolder } from "~/helpers/getFaviconForFolder";
import { api } from "~/utils/api";

export default function Bookmarks() {
  const session = useSession();
  const utils = api.useContext();
  const [inputUrl, setInputUrl] = useState("");
  const [isOpen, setIsOpen] = useAtom(isOpenAtom);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [viewStyle] = useAtom(viewStyleAtom);
  const [direction] = useAtom(directionAtom);
  const [currentFolder, setCurrentFolder] = useAtom(currentFolderAtom);

  const { data: folders, isLoading: foldersLoading } =
    api.folders.findByUserId.useQuery(
      { userId: String(session.data?.user.id) },
      {
        onSuccess: (data) => {
          if (data && data?.length > 0 && !currentFolder) {
            setCurrentFolder(data[0] ?? null);
          }
        },
      }
    );

  const { data: bookmarks, isLoading: bookmarksLoading } =
    api.bookmarks.findByFolderId.useQuery({
      folderId: String(currentFolder?.id),
      direction: direction,
    });

  const addBookmark = api.bookmarks.create.useMutation({
    onMutate: async () => {
      setInputUrl("");

      //optimistic update
      await utils.bookmarks.findByFolderId.cancel();

      const previousBookmarks = utils.bookmarks.findByFolderId.getData();

      utils.bookmarks.findByFolderId.setData(
        { folderId: String(currentFolder?.id), direction: direction },
        (oldQueryData: Bookmark[] | undefined) => {
          const newBookmark: Bookmark = {
            id: "temp",
            url: inputUrl,
            title: capitalizeFirstLetter(getWebsiteName(inputUrl)),
            folderId: "temp",
            faviconUrl: getCommonFavicons(inputUrl),
            ogImageUrl: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          if (direction === "desc") {
            // If the direction is "desc," add the new bookmark at the beginning of the list
            return oldQueryData
              ? [newBookmark, ...oldQueryData]
              : [newBookmark];
          } else {
            // If the direction is not "desc," add the new bookmark at the end of the list (default behavior)
            return oldQueryData
              ? [...oldQueryData, newBookmark]
              : [newBookmark];
          }
        }
      );

      return { previousBookmarks };
    },

    onSettled: () => {
      void utils.bookmarks.findByFolderId.invalidate();
    },
    onError: (context) => {
      const previousBookmarks =
        (context as { previousBookmarks?: Bookmark[] })?.previousBookmarks ??
        null;

      utils.bookmarks.findByFolderId.setData(
        { folderId: String(currentFolder?.id), direction: direction },
        previousBookmarks!
      );
    },
  });

  const deleteBookmark = api.bookmarks.delete.useMutation({
    onMutate: async ({ id }) => {
      await utils.bookmarks.findByFolderId.cancel();

      const previousBookmarks = utils.bookmarks.findByFolderId.getData();

      utils.bookmarks.findByFolderId.setData(
        { folderId: String(currentFolder?.id), direction: direction },
        (previousBookmarks: Bookmark[] | undefined) =>
          [
            ...(previousBookmarks?.filter((bookmark) => bookmark.id !== id) ??
              []),
          ] as Bookmark[]
      );

      return { previousBookmarks };
    },

    onSettled: () => {
      void utils.bookmarks.findByFolderId.invalidate();
    },
    onError: (context) => {
      const previousBookmarks =
        (context as { previousBookmarks?: Bookmark[] })?.previousBookmarks ??
        null;

      utils.bookmarks.findByFolderId.setData(
        { folderId: String(currentFolder?.id), direction: direction },
        previousBookmarks!
      );
    },
  });

  const handleCreateBookmark = useCallback(() => {
    addBookmark.mutate({
      url: inputUrl,
      folderId: String(currentFolder?.id),
    });
  }, [addBookmark, inputUrl, currentFolder?.id]);

  const handleDeleteBookmark = useCallback(
    (id: string) => {
      deleteBookmark.mutate({
        id,
      });
    },
    [deleteBookmark]
  );

  // Opening the bookmarks list
  useEffect(() => {
    if (!bookmarksLoading && bookmarks?.length) {
      setIsOpen(true);
    }
  }, [bookmarksLoading, bookmarks, setIsOpen]);

  // Scroll to the newly created bookmark
  useEffect(() => {
    const elementToScrollTo = document.getElementById("temp");

    if (elementToScrollTo) {
      // Get the element's position relative to the viewport
      const elementRect = elementToScrollTo.getBoundingClientRect();

      // Check if the element is not in the viewport
      if (
        elementRect.top < 0 ||
        elementRect.bottom > window.innerHeight ||
        elementRect.left < 0 ||
        elementRect.right > window.innerWidth
      ) {
        // Scroll to the element
        elementToScrollTo.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [bookmarks]);

  return (
    <>
      <Head>
        <title>{currentFolder?.name ?? "Bookmarks"}</title>
        <link rel="icon" href={getFaviconForFolder(currentFolder)} />
      </Head>
      <main className="relative min-h-screen w-full bg-gradient-to-br from-[#dfdfdf] to-[#f5f5f5] dark:from-[#202020] dark:to-[black]">
        <div className="flex flex-col items-center">
          <div className="w-[20rem] py-16 sm:w-[30rem] md:w-[40rem] lg:w-[50rem]">
            <div className="flex flex-col-reverse items-center justify-between gap-4 px-2 align-middle lg:flex-row lg:gap-0">
              <motion.form
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onSubmit={(e) => {
                  e.preventDefault();

                  if (
                    !currentFolder?.allowDuplicate &&
                    bookmarks?.find((bookmark) => bookmark.url === inputUrl)
                  ) {
                    setIsDuplicate(true);

                    setTimeout(() => {
                      setIsDuplicate(false);
                    }, 2000);

                    return;
                  }

                  handleCreateBookmark();
                }}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    name="url"
                    id="url"
                    value={isDuplicate ? "Duplicate" : inputUrl}
                    disabled={addBookmark.isLoading || !currentFolder}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="https://..."
                    className={`w-72 rounded-full bg-black/10 px-6 py-2 font-semibold text-black no-underline placeholder-slate-500 transition duration-300 ease-in-out placeholder:font-normal hover:bg-black/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 md:w-96 ${
                      isDuplicate ? "ring-2 ring-red-500" : ""
                    }`}
                  />
                  <motion.button
                    whileTap={{
                      scale: 0.8,
                    }}
                    type="submit"
                    disabled={
                      inputUrl.length === 0 ||
                      addBookmark.isLoading ||
                      !currentFolder
                    }
                    className={`duration-300'hover:bg-white/20 rounded-full bg-black/10 p-3 transition dark:bg-white/10 ${
                      inputUrl.length === 0 || addBookmark.isLoading
                        ? "bg-black/5 dark:bg-white/5"
                        : null
                    }`}
                  >
                    {addBookmark.isLoading ? (
                      <Spinner size="sm" />
                    ) : (
                      <PlusIcon className="h-4 w-4 text-black dark:text-white" />
                    )}
                  </motion.button>
                </div>
              </motion.form>

              <div className="flex items-center gap-2 align-middle">
                <ShareButton />
                <ProfileMenu />
              </div>
            </div>

            <div className={`mx-2 my-6`}>
              <Separator />
            </div>

            <div className="flex justify-between px-2 pb-4 align-middle">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-x-2 overflow-x-auto "
              >
                {foldersLoading ? (
                  [...Array<number>(3)].map((_, i) => (
                    <FolderSkeleton key={i} />
                  ))
                ) : folders && folders?.length > 0 ? (
                  folders?.map((folder) => (
                    <motion.div
                      whileTap={{
                        scale: 0.8,
                      }}
                      onClick={() => {
                        if (currentFolder?.id !== folder.id) {
                          setCurrentFolder(folder);
                          setIsOpen(false);
                          void utils.bookmarks.findByFolderId.invalidate();
                        }
                      }}
                      key={folder.id}
                      className={`${
                        currentFolder?.id === folder.id
                          ? "bg-black/20 dark:bg-white/30"
                          : ""
                      } group flex items-center gap-2 rounded-full bg-black/10 px-4 py-2 align-middle font-semibold text-black no-underline transition hover:cursor-pointer hover:bg-black/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20`}
                    >
                      {folder.icon && <div>{folder.icon}</div>}
                      <div>{folder.name}</div>
                    </motion.div>
                  ))
                ) : (
                  <p className={`text-center italic text-gray-500`}>
                    No folders yet, create one -{">"}
                  </p>
                )}
              </motion.div>
              <div className="flex gap-2">
                {folders && folders?.length > 0 && <DeleteFolderButton />}
                <CreateFolderButton />
              </div>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                initial={false}
                animate={isOpen ? "open" : "closed"}
                className="flex flex-col gap-8"
              >
                <motion.ul
                  className={`flex flex-col`}
                  variants={{
                    open: {
                      transition: {
                        type: "spring",
                        bounce: 0,
                        duration: 0.7,
                        staggerChildren: 0.08,
                        delayChildren: 0.2,
                      },
                    },
                    closed: {
                      transition: {
                        type: "spring",
                        bounce: 0,
                        duration: 0.3,
                      },
                    },
                  }}
                >
                  {bookmarksLoading || foldersLoading ? (
                    <SkeletonList viewStyle={viewStyle} />
                  ) : bookmarks && bookmarks?.length > 0 ? (
                    bookmarks.map((bookmark) => (
                      <div key={bookmark.id} id={bookmark.id}>
                        {viewStyle === "compact" ? (
                          <CompactBookmark
                            onRemove={handleDeleteBookmark}
                            bookmark={bookmark}
                          />
                        ) : (
                          <ExpandedBookmark
                            onRemove={handleDeleteBookmark}
                            bookmark={bookmark}
                          />
                        )}
                      </div>
                    ))
                  ) : (
                    bookmarks?.length === 0 && <EmptyState />
                  )}
                </motion.ul>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};
