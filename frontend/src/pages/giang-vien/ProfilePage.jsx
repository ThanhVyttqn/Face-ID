import { useEffect, useState } from 'react';
import {
    User,
    Mail,
    Phone,
    Building,
    Lock,
    Save,
    KeyRound,
    Loader2,
} from 'lucide-react';

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

import {
    getProfileApi,
    updateProfileApi,
    changePasswordApi,
} from '../../api/GiangVien_api';

import { toast } from 'sonner';

const InfoItem = ({ icon: Icon, label, value, iconColor }) => {
    return (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100">
            <Icon className={`w-5 h-5 ${iconColor}`} />

            <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-600">
                    {label}
                </p>
                <p className="text-base font-bold text-gray-900 truncate">
                    {value || '-'}
                </p>
            </div>
        </div>
    );
};

const ProfilePage = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);

    const [form, setForm] = useState({
        ho_ten: '',
        email: '',
        sdt: '',
    });

    const [passwordForm, setPasswordForm] = useState({
        mat_khau_cu: '',
        mat_khau_moi: '',
    });

    const fetchProfile = async () => {
        try {
            setLoading(true);

            const res = await getProfileApi();
            const data = res.data?.data;

            setProfile(data);

            setForm({
                ho_ten: data?.ho_ten || '',
                email: data?.email || '',
                sdt: data?.sdt || '',
            });
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Không tải được thông tin tài khoản');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();

        if (!form.ho_ten.trim()) {
            toast.error('Vui lòng nhập họ tên');
            return;
        }

        try {
            setSaving(true);

            await updateProfileApi({
                ho_ten: form.ho_ten.trim(),
                email: form.email.trim(),
                sdt: form.sdt.trim(),
            });

            toast.success('Cập nhật thông tin thành công');
            await fetchProfile();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Cập nhật thông tin thất bại');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();

        if (!passwordForm.mat_khau_cu.trim()) {
            toast.error('Vui lòng nhập mật khẩu hiện tại');
            return;
        }

        if (!passwordForm.mat_khau_moi.trim()) {
            toast.error('Vui lòng nhập mật khẩu mới');
            return;
        }

        if (passwordForm.mat_khau_moi.length < 6) {
            toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
            return;
        }

        try {
            setChangingPassword(true);

            await changePasswordApi(passwordForm);

            toast.success('Đổi mật khẩu thành công');

            setPasswordForm({
                mat_khau_cu: '',
                mat_khau_moi: '',
            });
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Đổi mật khẩu thất bại');
        } finally {
            setChangingPassword(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4 text-gray-700">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="font-semibold text-gray-800">
                        Đang tải thông tin tài khoản...
                    </p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-700 font-semibold">
                Không có dữ liệu tài khoản.
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-6xl mx-auto px-6 py-8">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-md">
                            <User className="w-8 h-8 text-white" />
                        </div>

                        <div>
                            <h1 className="text-3xl font-bold text-gray-950">
                                Tài khoản cá nhân
                            </h1>

                            <p className="text-sm font-medium text-gray-600 mt-1">
                                Quản lý thông tin cá nhân và đổi mật khẩu
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Thông tin tài khoản */}
                    <Card className="shadow-sm border border-gray-200 bg-white">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-950">
                                <User className="w-5 h-5 text-blue-600" />
                                Thông tin tài khoản
                            </CardTitle>
                        </CardHeader>

                        <CardContent>
                            <div className="flex flex-col items-center text-center mb-6">
                                <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-4xl font-bold shadow-md">
                                    {profile.ho_ten?.charAt(0)?.toUpperCase() || 'G'}
                                </div>

                                <h2 className="text-xl font-bold text-gray-950 mt-4">
                                    {profile.ho_ten}
                                </h2>

                                <p className="text-sm font-semibold text-gray-600">
                                    {profile.ma_gv}
                                </p>
                            </div>

                            <div className="space-y-4">
                                <InfoItem
                                    icon={Mail}
                                    label="Email"
                                    value={profile.email}
                                    iconColor="text-blue-600"
                                />

                                <InfoItem
                                    icon={Phone}
                                    label="Số điện thoại"
                                    value={profile.sdt}
                                    iconColor="text-green-600"
                                />

                                <InfoItem
                                    icon={Building}
                                    label="Khoa / Bộ môn"
                                    value={profile.ten_khoa || profile.ma_khoa}
                                    iconColor="text-purple-600"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Cập nhật thông tin */}
                    <Card className="lg:col-span-2 shadow-sm border border-gray-200 bg-white">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-950">
                                <Save className="w-5 h-5 text-blue-600" />
                                Cập nhật thông tin
                            </CardTitle>
                        </CardHeader>

                        <CardContent>
                            <form onSubmit={handleUpdateProfile} className="space-y-5">
                                <div>
                                    <Label className="text-sm font-bold text-gray-800">
                                        Mã giảng viên
                                    </Label>

                                    <Input
                                        value={profile.ma_gv || ''}
                                        disabled
                                        className="mt-2 h-11 bg-gray-100 text-gray-900 font-semibold disabled:opacity-100 disabled:text-gray-900"
                                    />
                                </div>

                                <div>
                                    <Label className="text-sm font-bold text-gray-800">
                                        Họ và tên
                                    </Label>

                                    <Input
                                        value={form.ho_ten}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                ho_ten: e.target.value,
                                            })
                                        }
                                        className="mt-2 h-11 text-gray-950 font-semibold placeholder:text-gray-400"
                                        placeholder="Nhập họ tên"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <Label className="text-sm font-bold text-gray-800">
                                            Email
                                        </Label>

                                        <Input
                                            type="email"
                                            value={form.email}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    email: e.target.value,
                                                })
                                            }
                                            className="mt-2 h-11 text-gray-950 font-semibold placeholder:text-gray-400"
                                            placeholder="Nhập email"
                                        />
                                    </div>

                                    <div>
                                        <Label className="text-sm font-bold text-gray-800">
                                            Số điện thoại
                                        </Label>

                                        <Input
                                            value={form.sdt}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    sdt: e.target.value,
                                                })
                                            }
                                            className="mt-2 h-11 text-gray-950 font-semibold placeholder:text-gray-400"
                                            placeholder="Nhập số điện thoại"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <Button
                                        type="submit"
                                        disabled={saving}
                                        className="bg-blue-600 hover:bg-blue-700 font-semibold"
                                    >
                                        {saving ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Đang lưu...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4 mr-2" />
                                                Lưu thay đổi
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Đổi mật khẩu */}
                <Card className="shadow-sm border border-gray-200 bg-white">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-950">
                            <Lock className="w-5 h-5 text-blue-600" />
                            Đổi mật khẩu
                        </CardTitle>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleChangePassword} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <Label className="text-sm font-bold text-gray-800">
                                        Mật khẩu hiện tại
                                    </Label>

                                    <Input
                                        type="password"
                                        value={passwordForm.mat_khau_cu}
                                        onChange={(e) =>
                                            setPasswordForm({
                                                ...passwordForm,
                                                mat_khau_cu: e.target.value,
                                            })
                                        }
                                        className="mt-2 h-11 text-gray-950 font-semibold placeholder:text-gray-500"
                                        placeholder="Nhập mật khẩu hiện tại"
                                    />
                                </div>

                                <div>
                                    <Label className="text-sm font-bold text-gray-800">
                                        Mật khẩu mới
                                    </Label>

                                    <Input
                                        type="password"
                                        value={passwordForm.mat_khau_moi}
                                        onChange={(e) =>
                                            setPasswordForm({
                                                ...passwordForm,
                                                mat_khau_moi: e.target.value,
                                            })
                                        }
                                        className="mt-2 h-11 text-gray-950 font-semibold placeholder:text-gray-500"
                                        placeholder="Nhập mật khẩu mới"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    type="submit"
                                    disabled={changingPassword}
                                    className="bg-blue-600 hover:bg-blue-700 font-semibold"
                                >
                                    {changingPassword ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Đang đổi...
                                        </>
                                    ) : (
                                        <>
                                            <KeyRound className="w-4 h-4 mr-2" />
                                            Đổi mật khẩu
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ProfilePage;