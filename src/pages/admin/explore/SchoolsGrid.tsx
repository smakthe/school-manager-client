import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { schoolsApi } from "../../../api/admin/schools";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Search, Edit, Trash2, Plus } from "lucide-react";
import { SchoolFormModal } from "../modals/SchoolFormModal";
import { ConfirmDialog } from "../../../components/shared/ConfirmDialog";

export function SchoolsGrid({
  onSelectSchool,
}: {
  onSelectSchool: (school: any) => void;
}) {
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMoreSchools, setLoadingMoreSchools] = useState(false);
  const [schoolMeta, setSchoolMeta] = useState<any>({ page: 1, pages: 1 });
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<any | null>(null);
  const [deleteConfig, setDeleteConfig] = useState<{
    isOpen: boolean;
    entity: any | null;
    loading: boolean;
  }>({ isOpen: false, entity: null, loading: false });

  const observer = useRef<IntersectionObserver | null>(null);
  const isFetchingRef = useRef(false);

  const lastElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (
          entries[0].isIntersecting &&
          !isFetchingRef.current &&
          schoolMeta.page < schoolMeta.pages
        ) {
          fetchSchools(schoolMeta.page + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [schoolMeta.page, schoolMeta.pages],
  );

  const fetchSchools = async (page = 1) => {
    isFetchingRef.current = true;
    if (page === 1) setLoading(true);
    else setLoadingMoreSchools(true);

    try {
      const res = await schoolsApi.list(page);
      if (page === 1) setSchools(res.data);
      else {
        setSchools((prev) => {
          const existingIds = new Set(prev.map((s) => s.id));
          return [
            ...prev,
            ...res.data.filter((s: any) => !existingIds.has(s.id)),
          ];
        });
      }
      setSchoolMeta(res.meta);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMoreSchools(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    fetchSchools(1);
  }, []);

  const filteredSchools = useMemo(
    () =>
      schools.filter(
        (s) =>
          s.attributes.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.attributes.subdomain
            .toLowerCase()
            .includes(searchQuery.toLowerCase()),
      ),
    [schools, searchQuery],
  );

  const confirmDelete = async () => {
    if (!deleteConfig.entity) return;
    setDeleteConfig((prev) => ({ ...prev, loading: true }));
    try {
      await schoolsApi.delete(deleteConfig.entity.id);
      await fetchSchools(1);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteConfig({ isOpen: false, entity: null, loading: false });
    }
  };

  if (loading && !loadingMoreSchools) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search schools..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button
          onClick={() => {
            setEditingSchool(null);
            setIsModalOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Add School
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        {filteredSchools.map((school, index) => {
          const card = (
            <Card
              className="cursor-pointer hover:border-primary transition-colors hover:shadow-md relative group h-full"
              onClick={() => onSelectSchool(school)}
            >
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <CardTitle className="text-lg font-bold pr-16 leading-tight">
                  {school.attributes.name}
                </CardTitle>
                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingSchool(school);
                      setIsModalOpen(true);
                    }}
                  >
                    <Edit className="h-3.5 w-3.5 text-primary" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfig({
                        isOpen: true,
                        entity: school,
                        loading: false,
                      });
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {school.attributes.board.toUpperCase()} Board
                </p>
                <p className="text-sm text-muted-foreground">
                  {school.attributes.subdomain}.school.com
                </p>
              </CardContent>
            </Card>
          );
          return filteredSchools.length === index + 1 ? (
            <div ref={lastElementRef} key={school.id}>
              {card}
            </div>
          ) : (
            <div key={school.id}>{card}</div>
          );
        })}
      </div>
      {loadingMoreSchools && (
        <div className="flex justify-center py-6">
          <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {isModalOpen && (
        <SchoolFormModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          schoolId={editingSchool?.id || null}
          onSuccess={() => fetchSchools(1)}
        />
      )}
      <ConfirmDialog
        open={deleteConfig.isOpen}
        onCancel={() =>
          setDeleteConfig({ isOpen: false, entity: null, loading: false })
        }
        onConfirm={confirmDelete}
        title="Delete School"
        description="Are you sure? This cannot be undone."
        isDeleting={deleteConfig.loading}
      />
    </div>
  );
}
