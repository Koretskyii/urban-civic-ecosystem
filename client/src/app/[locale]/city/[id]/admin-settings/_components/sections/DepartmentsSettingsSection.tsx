import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useCityDepartments,
  useCreateCityDepartment,
  useDeleteCityDepartment,
  useUpdateCityDepartment,
} from '@/hooks';
import type { Department } from '@/types';
import { useTranslations } from 'next-intl';

export function DepartmentsSettingsSection({ cityId }: { cityId: string }) {
  const t = useTranslations();
  const departmentsQuery = useCityDepartments(cityId);
  const createDepartmentMutation = useCreateCityDepartment();
  const updateDepartmentMutation = useUpdateCityDepartment();
  const deleteDepartmentMutation = useDeleteCityDepartment();
  const departments = departmentsQuery.data ?? [];
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState('');
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [formError, setFormError] = useState('');

  const isCreating = createDepartmentMutation.isPending;
  const isMutating =
    updateDepartmentMutation.isPending || deleteDepartmentMutation.isPending;

  const onCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError(t('adminSettings.departments.nameRequired'));
      return;
    }

    try {
      await createDepartmentMutation.mutateAsync({
        cityId,
        payload: {
          name: trimmedName,
          description: description.trim() || undefined,
        },
      });
      setName('');
      setDescription('');
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : t('adminSettings.departments.createError'),
      );
    }
  };

  const startEdit = (department: Department) => {
    setEditingId(department.id);
    setEditName(department.name);
    setEditDescription(department.description ?? '');
    setFormError('');
  };

  const cancelEdit = () => {
    setEditingId('');
    setEditName('');
    setEditDescription('');
  };

  const onUpdate = async (departmentId: string) => {
    setFormError('');
    const trimmedName = editName.trim();
    if (!trimmedName) {
      setFormError(t('adminSettings.departments.nameRequired'));
      return;
    }

    try {
      await updateDepartmentMutation.mutateAsync({
        cityId,
        departmentId,
        payload: {
          name: trimmedName,
          description: editDescription.trim() || undefined,
        },
      });
      cancelEdit();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : t('adminSettings.departments.updateError'),
      );
    }
  };

  const onDelete = async (departmentId: string) => {
    setFormError('');

    try {
      await deleteDepartmentMutation.mutateAsync({ cityId, departmentId });
      if (editingId === departmentId) cancelEdit();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : t('adminSettings.departments.deleteError'),
      );
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--primary)]">
            {t('adminSettings.sections.departments')}
          </h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            {t('adminSettings.departments.subtitle')}
          </p>
        </div>
      </div>

      <form
        onSubmit={onCreate}
        className="grid gap-2 rounded-md border border-black/10 p-3 md:grid-cols-[minmax(180px,260px)_1fr_auto]"
      >
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={t('adminSettings.departments.namePlaceholder')}
          disabled={isCreating}
          maxLength={120}
        />
        <Input
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder={t('adminSettings.departments.descriptionPlaceholder')}
          disabled={isCreating}
          maxLength={500}
        />
        <Button type="submit" disabled={isCreating}>
          {isCreating
            ? t('adminSettings.departments.creating')
            : t('adminSettings.departments.create')}
        </Button>
      </form>

      {formError ? (
        <p className="rounded-md border border-[var(--danger-light)] bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger-dark)]">
          {formError}
        </p>
      ) : null}

      {departmentsQuery.isLoading ? (
        <div className="text-sm text-[var(--muted-foreground)]">Loading...</div>
      ) : null}

      {departments.length === 0 && !departmentsQuery.isLoading ? (
        <p className="rounded-md border border-black/10 px-3 py-4 text-sm text-[var(--muted-foreground)]">
          {t('adminSettings.noDepartments')}
        </p>
      ) : null}

      {departments.length > 0 ? (
        <div className="overflow-x-auto border-y border-black/10">
          <div className="min-w-[840px]">
            <div className="grid grid-cols-[minmax(180px,1.1fr)_140px_minmax(260px,1.4fr)_120px_180px] border-b border-black/10 bg-[var(--surface-1)] px-3 py-2 text-xs font-semibold uppercase text-[var(--primary-light)]">
              <span>{t('adminSettings.name')}</span>
              <span>{t('adminSettings.departments.type')}</span>
              <span>{t('adminSettings.departments.description')}</span>
              <span>{t('adminSettings.departments.origin')}</span>
              <span>{t('adminSettings.actions')}</span>
            </div>

            {departments.map((department) => {
              const isEditing = editingId === department.id;

              return (
                <div
                  key={department.id}
                  className="grid grid-cols-[minmax(180px,1.1fr)_140px_minmax(260px,1.4fr)_120px_180px] items-center gap-2 border-b border-black/10 px-3 py-2 text-sm last:border-b-0"
                >
                  <div className="min-w-0">
                    {isEditing ? (
                      <Input
                        value={editName}
                        onChange={(event) => setEditName(event.target.value)}
                        disabled={isMutating}
                        maxLength={120}
                        className="h-9"
                      />
                    ) : (
                      <p className="truncate font-medium text-[var(--primary)]">
                        {department.name}
                      </p>
                    )}
                  </div>

                  <span className="truncate text-xs text-[var(--muted-foreground)]">
                    {department.type}
                  </span>

                  <div className="min-w-0">
                    {isEditing ? (
                      <Input
                        value={editDescription}
                        onChange={(event) =>
                          setEditDescription(event.target.value)
                        }
                        disabled={isMutating}
                        maxLength={500}
                        className="h-9"
                      />
                    ) : (
                      <p className="truncate text-[var(--primary-light)]">
                        {department.description ?? '-'}
                      </p>
                    )}
                  </div>

                  <span className="w-fit rounded-full bg-[var(--secondary)]/10 px-2 py-0.5 text-xs text-[var(--secondary-dark)]">
                    {department.isDefault
                      ? t('adminSettings.departments.defaultBadge')
                      : t('adminSettings.departments.customBadge')}
                  </span>

                  <div className="flex items-center gap-2">
                    {department.isDefault ? (
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {t('adminSettings.departments.locked')}
                      </span>
                    ) : isEditing ? (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => onUpdate(department.id)}
                          disabled={isMutating}
                        >
                          {t('adminSettings.departments.save')}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={cancelEdit}
                          disabled={isMutating}
                        >
                          {t('adminSettings.departments.cancel')}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(department)}
                          disabled={isMutating}
                        >
                          {t('adminSettings.departments.edit')}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="danger"
                          onClick={() => onDelete(department.id)}
                          disabled={isMutating}
                        >
                          {t('adminSettings.departments.delete')}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
